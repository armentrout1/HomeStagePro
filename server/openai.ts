import { toFile } from "openai";
import { Request, Response } from "express";

import { log } from "./vite";
import { storage } from "./storage";
import { buildStagingPrompt } from "./prompting/stagingPrompt";
import { openai } from "./openaiClient";
import { analyzeRoomLayout } from "./prompting/layoutAnalyzer";

type DecodedImage = {
  bytes: Uint8Array;
  mime: string;
  extension: string;
};

type ImageEditParamsWithFidelity = Parameters<typeof openai.images.edit>[0] & {
  input_fidelity?: "low" | "medium" | "high";
};

const decodeBase64Image = (base64: string): DecodedImage => {
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

  const { mime, extension } = detectImageType(bytes);

  return { bytes, mime, extension };
};

const detectImageType = (
  bytes: Uint8Array
): { mime: string; extension: string } => {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png", extension: "png" };
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", extension: "webp" };
  }

  return { mime: "image/png", extension: "png" };
};

export const generateStagedRoom = async (req: Request, res: Response) => {
  const reqId = `stage_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  try {
    if (!req.body.image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const decodedImage = decodeBase64Image(req.body.image);

    const layoutPrompt = await (async () => {
      try {
        const layout = await analyzeRoomLayout({
          roomType: req.body.roomType || "Unknown",
          imageBase64: req.body.image,
          mime: decodedImage.mime,
        });

        if (process.env.NODE_ENV !== "production") {
          log(
            `[${reqId}] layout.noFurnitureZones=${
              layout.noFurnitureZones?.join(" | ") || "None"
            }`
          );
          log(
            `[${reqId}] layout.preferredPlacements=${
              layout.preferredPlacements?.join(" | ") || "None"
            }`
          );
          log(
            `[${reqId}] layout.notes=${layout.notes?.join(" | ") || "None"}`
          );
        }

        const safeJoin = (items: string[]): string =>
          items.length ? items.join("; ") : "None provided";

        return `

Layout constraints (MUST FOLLOW):
- No-furniture zones: ${safeJoin(layout.noFurnitureZones)}
- Preferred placements: ${safeJoin(layout.preferredPlacements)}
- Notes: ${safeJoin(layout.notes)}
`;
      } catch (analysisError) {
        const err = analysisError as Error;
        log(`[${reqId}] layoutAnalyzerFailed: ${err.message}`);
        log(
          `Layout analyzer failed: ${err.message || "Unknown error"}. Proceeding without layout constraints.`
        );
        return "";
      }
    })();

    const finalPrompt = `${buildStagingPrompt(
      req.body.roomType || "Unknown"
    )}${layoutPrompt}`;

    if (process.env.NODE_ENV !== "production") {
      const preview =
        finalPrompt.length > 1200
          ? finalPrompt.slice(0, 1200) + "…(truncated)"
          : finalPrompt;
      log(`[${reqId}] finalPromptPreview=${preview}`);
    }

    const inputFile = await toFile(
      Buffer.from(decodedImage.bytes),
      `room.${decodedImage.extension}`,
      { type: decodedImage.mime }
    );

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: inputFile,
      prompt: finalPrompt,
      input_fidelity: "high",
    } as ImageEditParamsWithFidelity);

    const imageData = response.data?.[0] as (typeof response.data)[number] & {
      mime_type?: string;
    };

    const b64 = imageData?.b64_json;
    if (!b64) {
      throw new Error("No image returned from OpenAI edits");
    }

    const outputMime = imageData?.mime_type || "image/png";
    const imageUrl = `data:${outputMime};base64,${b64}`;

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
