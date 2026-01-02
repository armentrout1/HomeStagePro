export type PlanId = "quick-pack" | "value-pack" | "pro-monthly";

export type TokenAccessType = "pack" | "subscription";
export type ImageQuality = "medium" | "high";

export interface PlanConfig {
  id: PlanId;
  price: number;
  uses: number;
  durationDays: number;
  quality: ImageQuality;
  tokenType: TokenAccessType;
}

const YEAR_IN_DAYS = 365;

export const FREE_QUALITY: ImageQuality = "medium";
export const freeQuality = FREE_QUALITY;

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  "quick-pack": {
    id: "quick-pack",
    price: 9,
    uses: 5,
    durationDays: YEAR_IN_DAYS,
    quality: "high",
    tokenType: "pack",
  },
  "value-pack": {
    id: "value-pack",
    price: 25,
    uses: 20,
    durationDays: YEAR_IN_DAYS,
    quality: "high",
    tokenType: "pack",
  },
  "pro-monthly": {
    id: "pro-monthly",
    price: 49,
    uses: 50,
    durationDays: 30,
    quality: "high",
    tokenType: "subscription",
  },
};

export function isPlanId(value: string): value is PlanId {
  return (PLAN_CONFIGS as Record<string, PlanConfig>)[value] !== undefined;
}

export function resolvePlanId(planId?: string | null): PlanId | null {
  if (!planId) {
    return null;
  }

  return isPlanId(planId) ? planId : null;
}

export function getPlanConfig(planId?: string | null): PlanConfig | null {
  const canonical = resolvePlanId(planId);
  return canonical ? PLAN_CONFIGS[canonical] : null;
}

export function getExpirationTimestamp(durationDays: number, nowSeconds: number): number {
  return nowSeconds + durationDays * 24 * 60 * 60;
}
