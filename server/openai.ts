import OpenAI from "openai";
import { Request, Response } from "express";
import { log } from "./vite";
import { storage } from "./storage";

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateStagedRoom = async (req: Request, res: Response) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // The image should be base64 encoded
    const imageBase64 = req.body.image;
    const roomType = req.body.roomType || "Unknown";

    // Prompt for virtual staging
    const prompt = `Transform this empty ${roomType.toLowerCase()} into a beautifully staged space with modern furniture, proper lighting, and decoration that enhances the space. Make it look like a professional home staging for real estate photography.`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.images.edit({
      model: "dall-e-3",
      image: imageBase64,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0].url;

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