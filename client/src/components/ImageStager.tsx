import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";

// Define room types
const roomTypes = [
  { value: "living_room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "dining_room", label: "Dining Room" },
  { value: "office", label: "Home Office" },
  { value: "outdoor", label: "Outdoor Space" },
];

// Type definition for usage status
type UsageStatus = {
  usageCount: number;
  limit: number;
  remaining: number;
  status: 'active' | 'exceeded' | 'premium';
  accessToken?: {
    type: 'day-pass' | 'pack-10' | 'unlimited';
    expiresAt: string;
    timeRemaining: string;
    usageLeft?: number;
  };
};

export default function ImageStager() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [stagedImage, setStagedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roomType, setRoomType] = useState("living_room");
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Fetch usage status on component mount
  useEffect(() => {
    fetchUsageStatus();
  }, []);
  
  // Fetch usage status after each staging attempt
  const fetchUsageStatus = async () => {
    setIsLoadingUsage(true);
    try {
      const response = await fetch('/api/usage-status');
      if (response.ok) {
        const data = await response.json();
        setUsageStatus(data);
      }
    } catch (error) {
      console.error('Error fetching usage status:', error);
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Reset the staged image when a new file is uploaded
    setStagedImage(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setOriginalImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setStagedImage(null);
    setRoomType("living_room");
    
    toast({
      title: "Reset complete",
      description: "All images have been cleared",
    });
  };
  
  const handleStageImage = async () => {
    if (!originalImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image before staging",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Remove the data URL prefix to get just the base64 data
      const base64Image = originalImage.split(',')[1];

      // Get the selected room type label for the prompt
      const selectedRoomTypeLabel = roomTypes.find(rt => rt.value === roomType)?.label || "Room";

      // Log the staging process
      console.log(`Starting staging process for ${selectedRoomTypeLabel}`);

      const response = await fetch('/api/generate-staged-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: base64Image,
          roomType: selectedRoomTypeLabel 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check specifically for payment required (402) status
        if (response.status === 402) {
          throw new Error("Free usage limit reached. Please upgrade to continue staging rooms.");
        } else {
          throw new Error(data.error || 'Failed to generate staged image');
        }
      }

      setStagedImage(data.imageUrl);
      
      // Save the staged image to the database
      await saveImageToDatabase(data.imageUrl);
      
      toast({
        title: "Success!",
        description: "Your staged room image is ready",
      });
      
      // Refresh usage status after successful staging
      fetchUsageStatus();
    } catch (error) {
      console.error('Error staging image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate staged image",
        variant: "destructive",
      });
      
      // Refresh usage status even after error (might be due to limit)
      fetchUsageStatus();
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveImageToDatabase = async (stagedImageUrl: string) => {
    if (!originalImage || !stagedImageUrl) return;
    
    setIsSaving(true);
    try {
      // Create a filename-safe timestamp for the image URLs
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Create "URLs" that represent the images - for database storage
      // In a real application, we'd upload these to a storage service like S3
      // This approach stores the image URLs, not the full base64 images
      const originalImageForStorage = `original-image-${timestamp}.jpg`;
      const stagedImageForStorage = stagedImageUrl; // This is already a URL from OpenAI
      
      const response = await fetch('/api/staged-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalImageUrl: originalImageForStorage,
          stagedImageUrl: stagedImageForStorage,
          roomType: roomTypes.find(rt => rt.value === roomType)?.label || "Unknown",
          // Note: userId is null here since we're not implementing user authentication in this version
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save image to database');
      }
      
      // Invalidate any queries that might display staged images
      queryClient.invalidateQueries({ queryKey: ['/api/staged-images'] });
      
    } catch (error) {
      console.error('Error saving image to database:', error);
      // Don't show error toast since this is a background operation
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!stagedImage) return;
    
    const link = document.createElement('a');
    link.href = stagedImage;
    link.download = 'staged-room.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="p-6 shadow-md bg-white">
        <h3 className="text-2xl font-bold mb-4 text-center">Transform Your Room with AI Staging</h3>
        <p className="text-gray-600 mb-3 text-center">
          Upload a photo of your empty room and our AI will transform it into a beautifully staged space in seconds!
        </p>
        <div className="mb-6">
          <p className="text-sm text-blue-600 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Free usage: 2 room stagings per IP address
          </p>
          
          {/* Usage status */}
          {usageStatus && (
            <div className={`mt-2 text-center text-sm ${usageStatus.status === 'premium' ? 'text-green-600' : usageStatus.remaining === 0 ? 'text-red-500' : 'text-gray-500'}`}>
              <div className="flex items-center justify-center gap-1">
                {isLoadingUsage ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-primary mr-1"></div>
                ) : usageStatus.status === 'premium' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04C2.137 9.155 2 10.56 2 12c0 4.418 3.582 8 8 8s8-3.582 8-8c0-1.44-.137-2.845-.382-4.016z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                
                {usageStatus.status === 'premium' ? (
                  <div>
                    <span className="font-medium">Premium Access Active</span>
                    {usageStatus.accessToken && (
                      <div className="text-xs text-green-600 mt-1">
                        {usageStatus.accessToken.type === 'day-pass' && (
                          <>Day Pass: {usageStatus.accessToken.timeRemaining}</>
                        )}
                        {usageStatus.accessToken.type === 'pack-10' && (
                          <>Pack: {usageStatus.accessToken.usageLeft} stagings remaining</>
                        )}
                        {usageStatus.accessToken.type === 'unlimited' && (
                          <>Unlimited Access: {usageStatus.accessToken.timeRemaining}</>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <span>
                    {usageStatus.remaining > 0 
                      ? `You have ${usageStatus.remaining} free staging${usageStatus.remaining !== 1 ? 's' : ''} remaining` 
                      : (
                        <>
                          You have reached your free usage limit.{" "}
                          <Link to="/upgrade">
                            <span className="text-primary font-medium underline">Upgrade now</span>
                          </Link>
                        </>
                      )}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Room Type Selector */}
        <div className="mb-6">
          <Label htmlFor="room-type" className="block mb-2 text-center">Select Room Type</Label>
          <Select value={roomType} onValueChange={setRoomType}>
            <SelectTrigger id="room-type" className="max-w-xs mx-auto">
              <SelectValue placeholder="Select Room Type" />
            </SelectTrigger>
            <SelectContent>
              {roomTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left side - Original image */}
          <div className="flex flex-col">
            <p className="font-medium mb-2 text-center">Original Room</p>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer bg-gray-50 h-64 mb-4 overflow-hidden"
              onClick={triggerFileInput}
            >
              {originalImage ? (
                <img 
                  src={originalImage} 
                  alt="Original room" 
                  className="max-h-64 max-w-full object-contain" 
                />
              ) : (
                <div className="text-center p-6">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-12 w-12 mx-auto text-gray-400 mb-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                    />
                  </svg>
                  <p className="text-gray-500">Click to upload room photo</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG (max 10MB)</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
          
          {/* Right side - Staged image */}
          <div className="flex flex-col">
            <p className="font-medium mb-2 text-center">Staged Room</p>
            <div className="border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 h-64 mb-4 overflow-hidden">
              {isLoading ? (
                <div className="text-center p-6">
                  <div className="animate-spin rounded-full h-12 w-12 mx-auto border-b-2 border-primary mb-2"></div>
                  <p className="text-gray-500">Generating staged room...</p>
                  <p className="text-xs text-gray-400 mt-1">This may take a minute</p>
                </div>
              ) : stagedImage ? (
                <img 
                  src={stagedImage} 
                  alt="Staged room" 
                  className="max-h-64 max-w-full object-contain" 
                />
              ) : (
                <div className="text-center p-6">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-12 w-12 mx-auto text-gray-400 mb-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                    />
                  </svg>
                  <p className="text-gray-500">Your staged room will appear here</p>
                  <p className="text-xs text-gray-400 mt-1">Upload a photo and click Stage</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
          <Button 
            onClick={triggerFileInput}
            variant="outline"
            className="flex-1 max-w-xs mx-auto"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            Upload Photo
          </Button>
          {usageStatus && usageStatus.status !== 'premium' && usageStatus.remaining === 0 ? (
            <Link href="/upgrade">
              <Button 
                variant="default"
                className="flex-1 max-w-xs mx-auto"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
                Upgrade to Continue
              </Button>
            </Link>
          ) : (
            <Button 
              onClick={handleStageImage}
              variant="default"
              className="flex-1 max-w-xs mx-auto"
              disabled={!originalImage || isLoading}
              title={!originalImage ? "Please upload a photo first" : ""}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 10V3L4 14h7v7l9-11h-7z" 
                    />
                  </svg>
                  Stage Room
                </>
              )}
            </Button>
          )}
          {(originalImage || stagedImage) && (
            <Button 
              onClick={handleReset}
              variant="destructive"
              className="flex-1 max-w-xs mx-auto"
              disabled={isLoading}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Reset
            </Button>
          )}
          {stagedImage && (
            <Button 
              onClick={handleDownload}
              variant="secondary"
              className="flex-1 max-w-xs mx-auto"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                />
              </svg>
              Download
            </Button>
          )}
        </div>
        
        {/* Saving indicator */}
        {isSaving && (
          <div className="text-center mt-4 text-sm text-gray-500 flex items-center justify-center">
            <div className="h-3 w-3 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
            Saving image to gallery...
          </div>
        )}
      </Card>
    </div>
  );
}