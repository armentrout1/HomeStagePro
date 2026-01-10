import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { usageEntitlements, type UsageEntitlement } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { log } from "./vite";
import { getTokenIdFromRequest } from "./tokenManager";

export interface UsageResult {
  freeRemaining: number;
  paidRemaining: number;
  totalRemaining: number;
}

export const getOrCreateUsageEntitlement = async (
  tokenId: string,
): Promise<UsageEntitlement> => {
  const [inserted] = await db
    .insert(usageEntitlements)
    .values({ tokenId })
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    return inserted;
  }

  const [existing] = await db
    .select()
    .from(usageEntitlements)
    .where(eq(usageEntitlements.tokenId, tokenId))
    .limit(1);

  if (!existing) {
    throw new Error(`Failed to load usage entitlement for token ${tokenId}`);
  }

  return existing;
};

export const grantPaidCredits = async (
  tokenId: string,
  credits: number,
): Promise<void> => {
  await db.execute(sql`
    UPDATE usage_entitlements
    SET
      paid_granted = paid_granted + ${credits},
      updated_at = NOW()
    WHERE token_id = ${tokenId}
  `);
};

export const consumeOneEntitlement = async (
  tokenId: string,
): Promise<UsageResult> => {
  // Use raw SQL for atomic update with row locking
  // Token entitlements only track PAID credits (free is tracked per-IP separately)
  const result = await db.execute(sql`
    UPDATE usage_entitlements
    SET
      paid_used = paid_used + 1,
      updated_at = NOW()
    WHERE token_id = ${tokenId}
      AND paid_used < paid_granted
    RETURNING
      paid_granted,
      paid_used
  `);

  if (!result || result.length === 0) {
    // Check if the row exists but has no remaining usage
    const [existing] = await db
      .select()
      .from(usageEntitlements)
      .where(eq(usageEntitlements.tokenId, tokenId))
      .limit(1);

    if (!existing) {
      throw new Error(`No usage entitlement found for token ${tokenId}`);
    }

    throw new Error("No paid usage remaining");
  }

  const row = result[0] as {
    paid_granted: number;
    paid_used: number;
  };

  const paidRemaining = Math.max(0, row.paid_granted - row.paid_used);

  return {
    freeRemaining: 0, // Free is tracked per-IP, not per-token
    paidRemaining,
    totalRemaining: paidRemaining,
  };
};

export function ensureDbUsageOnSuccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const tokenId = getTokenIdFromRequest(req);

  if (!tokenId) {
    return next();
  }

  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    if (body?.success) {
      // Consume entitlement then send response
      consumeOneEntitlement(tokenId)
        .then((usage) => {
          log(
            `db_usage_consumed :: tokenId=${tokenId.slice(0, 8)}... freeRemaining=${usage.freeRemaining} paidRemaining=${usage.paidRemaining}`,
          );
          // Augment response with remaining counts
          body.usage = usage;
          originalJson.call(res, body);
        })
        .catch((err) => {
          log(`db_usage_consume_error :: tokenId=${tokenId.slice(0, 8)}... error=${err.message}`);
          // Still send response even on error
          originalJson.call(res, body);
        });

      return res;
    }

    return originalJson.call(res, body);
  };

  next();
}
