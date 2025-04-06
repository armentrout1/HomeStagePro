- ____________________________________________________________________________________________
- # AI-Powered Room Staging Application

This application is designed to help real estate professionals stage rooms using AI technology. Currently, the application uses DALL-E for image generation, but there are some limitations with overlay capabilities.

## Current Limitations

The current implementation using DALL-E has limitations when it comes to overlaying generated content onto existing room photos. DALL-E cannot currently maintain perfect perspective and structural alignment with the original room.

## Recommended Alternative Solution

🔁 For realistic overlays and advanced staging capabilities:

### 🚀 Option 1: Stable Diffusion + ControlNet
- ✅ Full control over structure preservation
- ✅ Can stage the exact room and match perspective

### 🧠 Technical Requirements:
- Hosting (e.g., Replicate, Banana.dev, or custom server with GPU)
- Knowledge of ControlNet implementation
- More computational resources than standard environments

👉 This solution is ideal for:
- Power users
- Professional real estate applications
- Agents/investors requiring high-quality staging

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Configure your environment variables
4. Run the development server with `npm run dev`

## Current Features
- Room photo upload
- Basic staging suggestions
- AI-powered visualization
- Real estate tips and guidance

## Future Improvements
We are actively working on implementing more advanced staging capabilities and improving the overlay accuracy of our AI-generated content.
___________________________________________________________________________________________________

# HomeStagePro

A web application for real estate image staging, leveraging AI to help users transform and optimize property images for maximum visual appeal.

## Features

- Upload room photos and transform them into staged versions using OpenAI's DALL-E 3
- Select room types (bedroom, living room, etc.) for more accurate staging results
- View, download, and save staged images
- Mobile-friendly responsive design
- Information pages about home staging, real estate photography, and selling tips
- Usage tracking with 2 free requests per IP address

## Future Implementations

### Payment System
- Implement Stripe Checkout for payments
- Offer tiered pricing plans:
  - 1-day pass: $3
  - 10 uses: $9
  - Unlimited monthly: $19
- Process payments with minimal friction (no user accounts required)

### Email Capture
- Add email capture form to homepage or upgrade page
- Collect name (optional) and email (required)
- Save emails in a simple .txt file, Google Sheet, or service like Formspree or EmailOctopus
- Form label: "Get staging tips + occasional updates"
- Style consistent with the rest of the site
