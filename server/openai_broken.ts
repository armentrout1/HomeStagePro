/// <reference types="node" />
import OpenAI, { toFile } from "openai";
import { Request, Response } from "express";

import { log } from "./vite";
import { storage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const decodeBase64Image = (base64: string): Uint8Array => {
  const sanitized = base64.replace(/[\r\n\s]/g, "");
  if (sanitized.length % 4 !== 0) {
    throw new Error("Invalid base64 image data");
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const charToIndex = (char: string): number => {
    if (char === "=") return 0;
    const index = chars.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid character in base64 image data");
    }
    return index;
  };

  const padding = sanitized.endsWith("==") ? 2 : sanitized.endsWith("=") ? 1 : 0;
  const outputLength = (sanitized.length * 3) / 4 - padding;
  const bytes = new Uint8Array(outputLength);

  let byteIndex = 0;
  for (let i = 0; i < sanitized.length; i += 4) {
    const chunk =
      (charToIndex(sanitized[i]) << 18) |
      (charToIndex(sanitized[i + 1]) << 12) |
      (charToIndex(sanitized[i + 2]) << 6) |
      charToIndex(sanitized[i + 3]);

    bytes[byteIndex++] = (chunk >> 16) & 0xff;
    if (sanitized[i + 2] !== "=") {
      bytes[byteIndex++] = (chunk >> 8) & 0xff;
    }
    if (sanitized[i + 3] !== "=") {
      bytes[byteIndex++] = chunk & 0xff;
    }
  }

  return bytes;
};

export const generateStagedRoom = async (req: Request, res: Response) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // Extract room type from request
    const roomType = req.body.roomType || "Unknown";
    
    // Create a prompt that focuses on adding furniture without changing the structure
    const prompt = `Add realistic, stylish furniture and home décor to this empty ${roomType.toLowerCase()}. Do not change the structure, lighting, floor, walls, or any part of the original photo. Only add furniture, wall art, rugs, lighting fixtures, and decorative objects as appropriate for a ${roomType.toLowerCase()}. The room should look naturally staged as if photographed in real life, matching the existing lighting and perspective.`;

    }
    if (sanitized[i + 3] !== "=") {
      bytes[byteIndex++] = chunk & 0xff;

    const imageUrl = `data:image/png;base64,${b64}`;

    return res.json({
      success: true,
      imageUrl: imageUrl,
    });
  } catch (err) {
    const error = err as Error;
    log(`OpenAI API error: ${error.message || 'Unknown error'}`);
    return res.status(500).json({
      success: false,
      error: `Error generating image: ${error.message || 'Unknown error'}`,
    });
  }
};

export const saveStagedImage = async (req: Request, res: Response) => {
  try {
    const { userId, originalImageUrl, stagedImageUrl, roomType } = req.body;
    
    if (!originalImageUrl || !stagedImageUrl) {
      return res.status(400).json({ error: "Both original and staged image URLs are required" });
    }
    
    const stagedImage = await storage.createStagedImage({
      userId: userId || null, // Make userId optional for guest users
      originalImageUrl,
      stagedImageUrl,
      roomType: roomType || "Unknown",
    });
    
    return res.json({
      success: true,
      stagedImage,
    });
  } catch (err) {
    const error = err as Error;
    log(`Database error: ${error.message || 'Unknown error'}`);
    return res.status(500).json({
      success: false,
      error: `Error saving staged image: ${error.message || 'Unknown error'}`,
    });
  }
};

export const getUserStagedImages = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const images = await storage.getStagedImagesByUserId(userId);
    
    return res.json({
      success: true,
      images,
    });
  } catch (err) {
    const error = err as Error;
    log(`Database error: ${error.message || 'Unknown error'}`);
    return res.status(500).json({
      success: false,
      error: `Error retrieving staged images: ${error.message || 'Unknown error'}`,
    });
  }
};