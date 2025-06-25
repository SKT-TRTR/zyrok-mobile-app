import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Share, Music, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface Video {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  user: {
    id: string;
    username: string;
    profileImageUrl: string;
  };
  likesCount: number;
  commentsCount: number;
  musicTitle?: string;
  isLiked?: boolean;
  isFollowing?: boolean;
}

export default function ForYouFeed() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videos, setVideos] = useState<Video[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { data: feedData, isLoading } = useQuery({
    queryKey: ["/api/videos"],
    enabled: !!user,
  });

  useEffect(() => {
    if (feedData) {
      setVideos(feedData);
    }
  }, [feedData]);

  const handleScroll = (direction: 'up' | 'down') => {
    const newIndex = direction === 'up' 
      ? Math.max(0, currentVideoIndex - 1)
      : Math.min(videos.length - 1, currentVideoIndex + 1);
    
    setCurrentVideoIndex(newIndex);
    
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: newIndex * window.innerHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleLike = async (videoId: number) => {
    try {
      await fetch(`/api/videos/${videoId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Optimistically update UI
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { 
              ...video, 
              isLiked: !video.isLiked,
              likesCount: video.isLiked ? video.likesCount - 1 : video.likesCount + 1
            }
          : video
      ));
    } catch (error) {
      console.error('Failed to like video:', error);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Optimistically update UI
      setVideos(prev => prev.map(video => 
        video.user.id === userId 
          ? { ...video, isFollowing: !video.isFollowing }
          : video
      ));
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Top Navigation - TikTok Style */}
      <div className="absolute top-0 left-0 right-0 z-50 pt-12 pb-4">
        <div className="flex items-center justify-center space-x-8">
          <button className="text-gray-400 text-lg font-medium">Live</button>
          <button className="text-white text-lg font-semibold">For You</button>
          <button className="text-gray-400 text-lg font-medium">Following</button>
        </div>
      </div>

      {/* Video Container */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="relative h-screen snap-start flex items-center justify-center"
          >
            {/* Video Player */}
            <video
              src={video.videoUrl}
              autoPlay={index === currentVideoIndex}
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              {/* Right Side Actions - TikTok Style */}
              <div className="absolute right-3 bottom-32 space-y-4">
                {/* User Avatar */}
                <div className="relative flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white">
                    <img 
                      src={video.user.profileImageUrl || '/default-avatar.png'} 
                      alt={video.user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {!video.isFollowing && (
                    <Button
                      onClick={() => handleFollow(video.user.id)}
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full bg-red-500 text-white p-0 text-lg font-bold"
                    >
                      +
                    </Button>
                  )}
                </div>

                {/* Like Button */}
                <div className="flex flex-col items-center">
                  <Button
                    onClick={() => handleLike(video.id)}
                    variant="ghost"
                    size="lg"
                    className="w-12 h-12 p-0 hover:scale-110 transition-transform"
                  >
                    <Heart 
                      className={`w-9 h-9 ${video.isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} 
                    />
                  </Button>
                  <span className="text-white text-xs font-semibold mt-1">
                    {video.likesCount > 1000 ? `${(video.likesCount / 1000).toFixed(1)}K` : video.likesCount}
                  </span>
                </div>

                {/* Comment Button */}
                <div className="flex flex-col items-center">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-12 h-12 p-0 hover:scale-110 transition-transform"
                  >
                    <MessageCircle className="w-9 h-9 text-white" />
                  </Button>
                  <span className="text-white text-xs font-semibold mt-1">
                    {video.commentsCount > 1000 ? `${(video.commentsCount / 1000).toFixed(1)}K` : video.commentsCount}
                  </span>
                </div>

                {/* Share Button */}
                <div className="flex flex-col items-center">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-12 h-12 p-0 hover:scale-110 transition-transform"
                  >
                    <Share className="w-8 h-8 text-white" />
                  </Button>
                  <span className="text-white text-xs font-semibold mt-1">Share</span>
                </div>

                {/* Music Disc - TikTok Style */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                    <Music className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Bottom Content - TikTok Style */}
              <div className="absolute bottom-4 left-4 right-20">
                <div className="space-y-2">
                  {/* Username */}
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold text-base">@{video.user.username}</span>
                    {video.isFollowing && (
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="text-white text-sm">
                    {video.description && (
                      <p className="leading-relaxed mb-2">{video.description}</p>
                    )}
                    
                    {/* Hashtags */}
                    <div className="flex flex-wrap gap-1">
                      <span className="text-white font-semibold">#fyp</span>
                      <span className="text-white font-semibold">#viral</span>
                      <span className="text-white font-semibold">#zyrok</span>
                    </div>
                  </div>

                  {/* Music Info - TikTok Style */}
                  <div className="flex items-center space-x-2 mt-3">
                    <Music className="w-4 h-4 text-white" />
                    <div className="flex-1 overflow-hidden">
                      <div className="animate-marquee whitespace-nowrap">
                        <span className="text-white text-sm">
                          {video.musicTitle || "original sound - " + video.user.username}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>
        ))}
      </div>


    </div>
  );
}