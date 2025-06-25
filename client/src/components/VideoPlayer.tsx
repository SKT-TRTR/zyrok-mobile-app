import { useRef, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useSocket } from "@/hooks/useSocket";

interface VideoPlayerProps {
  video: any;
  isActive: boolean;
  onOpenComments: () => void;
  onOpenProfile: () => void;
  onProFeature: () => void;
}

export default function VideoPlayer({ 
  video, 
  isActive, 
  onOpenComments, 
  onOpenProfile,
  onProFeature 
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiked, setIsLiked] = useState(video.isLiked || false);
  const [isFollowing, setIsFollowing] = useState(video.isFollowing || false);
  const [likesCount, setLikesCount] = useState(video.likesCount || 0);
  const [showHeart, setShowHeart] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time WebSocket integration
  const { joinVideo, leaveVideo, toggleLike: socketToggleLike, toggleFollow: socketToggleFollow } = useSocket({
    onLikeUpdated: (data) => {
      if (data.videoId === video.id.toString()) {
        setLikesCount(data.likesCount);
        setIsLiked(data.isLiked);
      }
    },
    onFollowUpdated: (data) => {
      if (data.followingId === video.user.id) {
        setIsFollowing(data.isFollowing);
      }
    }
  });

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      videoElement.play().catch(() => {
        // Auto-play failed, user interaction required
      });
      // Join video room for real-time updates
      joinVideo(video.id.toString());
    } else {
      videoElement.pause();
      // Leave video room when not active
      leaveVideo(video.id.toString());
    }

    return () => {
      // Clean up when component unmounts
      leaveVideo(video.id.toString());
    };
  }, [isActive, video.id, joinVideo, leaveVideo]);

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/videos/${video.id}/like`);
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: (error) => {
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
        title: "Error",
        description: "Failed to like video",
        variant: "destructive",
      });
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${video.userId}/follow`);
    },
    onSuccess: () => {
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    },
    onError: (error) => {
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
        title: "Error",
        description: "Failed to follow user",
        variant: "destructive",
      });
    },
  });

  const handleDoubleClick = () => {
    if (!isLiked) {
      likeMutation.mutate();
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  const handleLike = () => {
    // Optimistic update for immediate feedback
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    // Use real-time WebSocket for immediate broadcast
    socketToggleLike(video.id.toString());

    // Also update via API for persistence
    likeMutation.mutate();
  };

  const handleFollow = () => {
    // Optimistic update for immediate feedback
    setIsFollowing(!isFollowing);

    // Use real-time WebSocket for immediate broadcast
    socketToggleFollow(video.user.id);

    // Also update via API for persistence
    followMutation.mutate();
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
        poster={video.thumbnailUrl}
        onDoubleClick={handleDoubleClick}
      >
        <source src={video.videoUrl} type="video/mp4" />
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>

      {/* AI Enhanced Badge */}
      {video.isAiEnhanced && (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-full flex items-center z-10">
          <i className="fas fa-robot text-white text-xs mr-1"></i>
          <span className="text-white text-xs font-medium">AI Enhanced</span>
        </div>
      )}

      {/* Double Tap Heart Animation */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <i className="fas fa-heart text-pink-500 text-6xl animate-ping"></i>
        </div>
      )}

      {/* Video Info */}
      <div className="absolute bottom-20 left-4 right-20 z-10">
        <div className="flex items-center mb-3">
          <Avatar 
            className="w-10 h-10 mr-3 border-2 border-white cursor-pointer"
            onClick={onOpenProfile}
          >
            <AvatarImage src={video.user.profileImageUrl || ""} alt={video.user.username} />
            <AvatarFallback className="bg-pink-500 text-white">
              {video.user.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span 
            className="font-semibold text-white cursor-pointer"
            onClick={onOpenProfile}
          >
            @{video.user.username || video.user.firstName}
          </span>
          {video.user.isProUser && (
            <i className="fas fa-check-circle text-cyan-400 ml-2 text-sm"></i>
          )}
          {!isFollowing && (
            <Button
              onClick={handleFollow}
              disabled={followMutation.isPending}
              className="ml-3 bg-pink-500 hover:bg-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium"
            >
              Follow
            </Button>
          )}
        </div>
        <p className="text-white text-sm mb-2">{video.description}</p>
        {video.soundName && (
          <div className="flex items-center text-white text-sm">
            <i className="fas fa-music mr-2"></i>
            <span>{video.soundName}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center space-y-6 z-10">
        {/* User Avatar */}
        <div className="relative">
          <Avatar 
            className="w-12 h-12 border-2 border-white cursor-pointer"
            onClick={onOpenProfile}
          >
            <AvatarImage src={video.user.profileImageUrl || ""} alt={video.user.username} />
            <AvatarFallback className="bg-pink-500 text-white">
              {video.user.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!isFollowing && (
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center cursor-pointer"
                 onClick={handleFollow}>
              <i className="fas fa-plus text-white text-xs"></i>
            </div>
          )}
        </div>

        {/* Like Button */}
        <button 
          className="flex flex-col items-center"
          onClick={handleLike}
          disabled={likeMutation.isPending}
        >
          <div className="w-12 h-12 flex items-center justify-center">
            <i className={`fas fa-heart text-2xl ${isLiked ? 'text-pink-500' : 'text-white'}`}></i>
          </div>
          <span className="text-white text-xs mt-1">{formatCount(likesCount)}</span>
        </button>

        {/* Comment Button */}
        <button 
          className="flex flex-col items-center"
          onClick={onOpenComments}
        >
          <div className="w-12 h-12 flex items-center justify-center">
            <i className="fas fa-comment-dots text-white text-2xl"></i>
          </div>
          <span className="text-white text-xs mt-1">{formatCount(video.commentsCount || 0)}</span>
        </button>

        {/* Share Button */}
        <button 
          className="flex flex-col items-center"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: video.title,
                text: video.description,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              toast({
                title: "Link copied",
                description: "Video link copied to clipboard",
              });
            }
          }}
        >
          <div className="w-12 h-12 flex items-center justify-center">
            <i className="fas fa-share text-white text-2xl"></i>
          </div>
          <span className="text-white text-xs mt-1">{formatCount(video.sharesCount || 0)}</span>
        </button>

        {/* AI Features Button (Pro only) */}
        <button 
          className="flex flex-col items-center"
          onClick={video.user.isProUser ? () => {} : onProFeature}
        >
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <i className="fas fa-robot text-white text-lg"></i>
          </div>
          <span className="text-white text-xs mt-1">AI</span>
        </button>

        {/* Rotating Music Disc */}
        <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center border-2 border-white animate-spin"
             style={{ animationDuration: '3s' }}>
          <i className="fas fa-music text-white text-sm"></i>
        </div>
      </div>
    </div>
  );
}
