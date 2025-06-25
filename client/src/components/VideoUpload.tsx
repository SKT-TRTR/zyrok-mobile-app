import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface VideoUploadProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function VideoUpload({ onClose, onSuccess }: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [soundName, setSoundName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simulate upload progress
      setIsProcessing(true);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const response = await fetch("/api/videos", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      resetForm();
      setIsProcessing(false);
      onSuccess?.();
    },
    onError: (error) => {
      setIsProcessing(false);
      setUploadProgress(0);
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid File",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Video file must be under 100MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    if (videoPreviewRef.current) {
      const url = URL.createObjectURL(file);
      videoPreviewRef.current.src = url;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("title", title || "Untitled Video");
    formData.append("description", description);
    formData.append("soundName", soundName);
    formData.append("sourceType", "original");

    uploadMutation.mutate(formData);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle("");
    setDescription("");
    setSoundName("");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.src = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="max-w-md mx-auto bg-black text-white p-4 h-screen overflow-y-auto">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-xl">Upload Video</CardTitle>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <i className="fas fa-times text-lg"></i>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Selection */}
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-pink-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="space-y-3">
                  <i className="fas fa-video text-pink-500 text-3xl"></i>
                  <div>
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  {/* Video Preview */}
                  <video
                    ref={videoPreviewRef}
                    className="w-full max-w-xs mx-auto rounded-lg"
                    controls
                    muted
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <i className="fas fa-cloud-upload-alt text-gray-400 text-3xl"></i>
                  <div>
                    <p className="text-white">Click to select video</p>
                    <p className="text-gray-400 text-sm">MP4, MOV, AVI up to 100MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Video Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your video a catchy title..."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your video... #hashtags"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-gray-500 text-xs mt-1">
                {description.length}/500 characters
              </p>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Sound/Music (optional)
              </label>
              <Input
                value={soundName}
                onChange={(e) => setSoundName(e.target.value)}
                placeholder="Original sound, song name, etc."
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                maxLength={100}
              />
            </div>
          </div>

          {/* Upload Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white">Uploading...</span>
                <span className="text-gray-400">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-gray-600 text-white hover:bg-gray-800"
              onClick={resetForm}
              disabled={isProcessing}
            >
              Clear
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? "Uploading..." : "Post Video"}
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">Tips for better videos:</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• Use good lighting and stable footage</li>
              <li>• Keep videos short and engaging (15-60 seconds)</li>
              <li>• Add trending hashtags for better reach</li>
              <li>• Post at peak hours for maximum views</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
