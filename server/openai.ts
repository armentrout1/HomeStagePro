// Legacy image history routes. Generation is owned by staging/service.ts.
import { z } from "zod";
import type { Request, Response } from "express";
import { log } from "./vite";
import { storage } from "./storage";
import { requireAuthedUserId } from "./tokenManager";
const STORAGE_BUCKET = "roomstager-images";

const stagedImageSchema = z.object({
  originalStoragePath: z.string().min(1),
  stagedStoragePath: z.string().min(1),
  userId: z.number().int().positive().optional().nullable(),
  originalImageUrl: z.string().url().optional().nullable(),
  stagedImageUrl: z.string().url().optional().nullable(),
  storageBucket: z.string().max(100).optional(),
  roomType: z.string().max(50).optional(),
});

export const saveStagedImage = async (req: Request, res: Response) => {
  try {
    const parsed = stagedImageSchema.parse(req.body);

    const stagedImage = await storage.createStagedImage({
      userId: parsed.userId ?? null,
      originalImageUrl: parsed.originalImageUrl ?? null,
      stagedImageUrl: parsed.stagedImageUrl ?? null,
      originalStoragePath: parsed.originalStoragePath,
      stagedStoragePath: parsed.stagedStoragePath,
      storageBucket: parsed.storageBucket || STORAGE_BUCKET,
      roomType: parsed.roomType || "Unknown",
    });

    return res.json({
      success: true,
      stagedImage,
    });
  } catch (err) {
    const error = err as Error;
    if (err instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: err.issues });
    }
    log(`Database error: ${error.message || "Unknown error"}`);
    return res.status(500).json({
      success: false,
      error: `Error saving staged image: ${error.message || "Unknown error"}`,
    });
  }
};

export const getUserStagedImages = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const authedUserId = requireAuthedUserId(req);
    if (authedUserId === null) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (authedUserId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const images = await storage.getStagedImagesByUserId(userId);

    return res.json({
      success: true,
      images,
    });
  } catch (err) {
    const error = err as Error;
    log(`Database error: ${error.message || "Unknown error"}`);
    return res.status(500).json({
      success: false,
      error: `Error retrieving staged images: ${error.message || "Unknown error"}`,
    });
  }
};
