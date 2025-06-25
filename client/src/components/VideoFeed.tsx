import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VideoPlayer from "./VideoPlayer";
import CommentsModal from "./CommentsModal";
import ProfileModal from "./ProfileModal";
import ProModal from "./ProModal";

export default function VideoFeed() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["/api/videos", { limit: 10 }],
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      isDragging = false;

      const endY = e.changedTouches[0].clientY;
      const diff = startY - endY;

      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentVideoIndex < (videos?.length || 0) - 1) {
          // Swipe up - next video
          setCurrentVideoIndex(prev => prev + 1);
        } else if (diff < 0 && currentVideoIndex > 0) {
          // Swipe down - previous video
          setCurrentVideoIndex(prev => prev - 1);
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentVideoIndex, videos]);

  const handleOpenComments = (video: any) => {
    setSelectedVideo(video);
    setShowComments(true);
  };

  const handleOpenProfile = (user: any) => {
    setSelectedUser(user);
    setShowProfile(true);
  };

  const handleProFeature = () => {
    setShowProModal(true);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-2">No videos available</p>
          <p className="text-gray-400 text-sm">Be the first to upload a video!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={containerRef}
        className="h-full overflow-hidden"
        style={{ 
          transform: `translateY(-${currentVideoIndex * 100}vh)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        {videos.map((video: any, index: number) => (
          <div key={video.id} className="h-screen w-full flex-shrink-0">
            <VideoPlayer
              video={video}
              isActive={index === currentVideoIndex}
              onOpenComments={() => handleOpenComments(video)}
              onOpenProfile={() => handleOpenProfile(video.user)}
              onProFeature={handleProFeature}
            />
          </div>
        ))}
      </div>

      {/* Modals */}
      <CommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        video={selectedVideo}
      />
      
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={selectedUser}
      />
      
      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
      />
    </>
  );
}
