import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: any;
}

export default function CommentsModal({ isOpen, onClose, video }: CommentsModalProps) {
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Real-time WebSocket integration
  const { joinVideo, leaveVideo, sendComment, sendTyping } = useSocket({
    onCommentAdded: (comment) => {
      setLocalComments(prev => [comment, ...prev]);
    },
    onUserTyping: (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    }
  });

  const { data: comments, isLoading } = useQuery({
    queryKey: [`/api/videos/${video?.id}/comments`],
    enabled: isOpen && !!video?.id,
  });

  // Join/leave video room when modal opens/closes
  useEffect(() => {
    if (isOpen && video?.id) {
      joinVideo(video.id.toString());
      setLocalComments([]); // Reset local comments when opening
    } else if (video?.id) {
      leaveVideo(video.id.toString());
    }

    return () => {
      if (video?.id) {
        leaveVideo(video.id.toString());
      }
    };
  }, [isOpen, video?.id, joinVideo, leaveVideo]);

  // Combine server comments with real-time local comments
  const allComments = [...localComments, ...(comments || []).filter(
    (comment: any) => !localComments.some(local => local.id === comment.id)
  )];

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/videos/${video.id}/comments`, { content });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${video.id}/comments`] });
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
        description: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim() || !user) return;

    const commentText = newComment.trim();
    setNewComment("");

    // Send via WebSocket for real-time updates
    sendComment(video.id.toString(), commentText);

    // Also persist via API
    commentMutation.mutate(commentText);
  };

  const handleTyping = (isTyping: boolean) => {
    if (user) {
      sendTyping(video.id.toString(), isTyping);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-gray-900 rounded-t-3xl w-full max-h-3/4 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Comments</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-white"
            >
              <i className="fas fa-times text-xl"></i>
            </Button>
          </div>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500"></div>
            </div>
          ) : allComments?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No comments yet</p>
              <p className="text-gray-500 text-sm">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {typingUsers.size > 0 && (
                <div className="text-sm text-gray-400 italic px-3">
                  {typingUsers.size === 1 ? "Someone is typing..." : `${typingUsers.size} people are typing...`}
                </div>
              )}
              {allComments?.map((comment: any) => (
                <div key={comment.id} className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user.profileImageUrl || ""} alt={comment.user.username} />
                    <AvatarFallback className="bg-pink-500 text-white text-sm">
                      {comment.user.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-white text-sm font-medium">
                        @{comment.user.username || comment.user.firstName}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-white text-sm mt-1">{comment.content}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <button className="text-gray-500 text-xs hover:text-white">
                        Reply
                      </button>
                      <button className="flex items-center space-x-1 hover:text-pink-500">
                        <i className="fas fa-heart text-gray-500 text-xs"></i>
                        <span className="text-gray-500 text-xs">{comment.likesCount || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImageUrl || ""} alt={user?.username} />
              <AvatarFallback className="bg-pink-500 text-white text-sm">
                {user?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex items-center bg-gray-800 rounded-full px-4 py-2">
              <Input
                type="text"
                placeholder="Add comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                onFocus={() => handleTyping(true)}
                onBlur={() => handleTyping(false)}
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none border-none"
                disabled={commentMutation.isPending}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || commentMutation.isPending}
                variant="ghost"
                size="sm"
                className="text-pink-500 hover:text-pink-400 ml-2"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
