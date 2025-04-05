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

    // Extract room type from request
    const roomType = req.body.roomType || "Unknown";
    
    // Create a more detailed prompt for DALL-E 3
    const prompt = `Create a professional real estate photo of a beautifully staged ${roomType.toLowerCase()} with modern furniture, proper lighting, and tasteful decor. Show a spacious, clean room with high-end staging that would appeal to potential home buyers. The staging should include appropriate furniture layout, accent pieces, and color palette for a ${roomType.toLowerCase()}. No people should be in the image. Ultra realistic, professional photography quality.`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    // We're using images.generate instead of images.edit as it's more reliable for this use case
    // Also, we should use DALL-E 3 for image generation
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
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