import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userVideos } = useQuery({
    queryKey: [`/api/users/${user?.id}/videos`],
    enabled: isOpen && !!user?.id,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${user.id}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
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

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (!isOpen || !user) return null;

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      <div className="h-full">
        {/* Profile Header */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-purple-600 to-pink-600"></div>
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-white"
              onClick={onClose}
            >
              <i className="fas fa-arrow-left text-xl"></i>
            </Button>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="text-white">
                <i className="fas fa-share text-xl"></i>
              </Button>
              <Button variant="ghost" size="sm" className="text-white">
                <i className="fas fa-ellipsis-h text-xl"></i>
              </Button>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="px-4 -mt-16 relative z-10">
            <Avatar className="w-20 h-20 border-4 border-white mb-4">
              <AvatarImage src={user.profileImageUrl || ""} alt={user.username} />
              <AvatarFallback className="bg-pink-500 text-white text-xl">
                {user.username?.[0]?.toUpperCase() || user.firstName?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-white text-2xl font-bold mb-1">
              @{user.username || `${user.firstName} ${user.lastName}`}
            </h1>
            <p className="text-gray-300 text-sm mb-4">
              {user.bio || "No bio available"}
            </p>
            
            {/* Stats */}
            <div className="flex space-x-6 mb-6">
              <div className="text-center">
                <div className="text-white font-bold text-lg">
                  {formatCount(user.followingCount || 0)}
                </div>
                <div className="text-gray-400 text-sm">Following</div>
              </div>
              <div className="text-center">
                <div className="text-white font-bold text-lg">
                  {formatCount(user.followersCount || 0)}
                </div>
                <div className="text-gray-400 text-sm">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-white font-bold text-lg">
                  {formatCount(user.likesCount || 0)}
                </div>
                <div className="text-gray-400 text-sm">Likes</div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3 mb-6">
              {isOwnProfile ? (
                <>
                  <Button className="flex-1 bg-gray-800 text-white border-gray-600">
                    Edit Profile
                  </Button>
                  <Button className="flex-1 bg-gray-800 text-white border-gray-600">
                    Settings
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                  >
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button className="flex-1 border border-gray-600 text-white hover:bg-gray-800">
                    Message
                  </Button>
                  <Button className="border border-gray-600 text-white px-4 hover:bg-gray-800">
                    <i className="fas fa-chevron-down"></i>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button className="flex-1 py-3 text-white border-b-2 border-white font-medium">
            Videos
          </button>
          <button className="flex-1 py-3 text-gray-500">
            Liked
          </button>
        </div>
        
        {/* Video Grid */}
        <div className="grid grid-cols-3 gap-1 p-1">
          {userVideos?.map((video: any) => (
            <div key={video.id} className="aspect-square bg-gray-800 relative">
              <img 
                src={video.thumbnailUrl || "/api/placeholder/200/200"} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 left-1 flex items-center">
                <i className="fas fa-play text-white text-xs mr-1"></i>
                <span className="text-white text-xs">
                  {formatCount(video.viewsCount || 0)}
                </span>
              </div>
            </div>
          ))}
          
          {(!userVideos || userVideos.length === 0) && (
            <div className="col-span-3 text-center py-8">
              <p className="text-gray-400">No videos yet</p>
              {isOwnProfile && (
                <p className="text-gray-500 text-sm">Start creating amazing content!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
