import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useToast } from "@/hooks/use-toast";

export default function NotificationToast() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);

  useSocket({
    onCommentAdded: (comment) => {
      toast({
        title: "New Comment",
        description: `${comment.user.firstName || comment.user.email} commented on a video`,
      });
    },
    onFollowUpdated: (data) => {
      if (data.isFollowing) {
        toast({
          title: "New Follower",
          description: "Someone started following you!",
        });
      }
    }
  });

  return null; // This component only handles notifications
}