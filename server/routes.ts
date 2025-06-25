import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { serverlessStorage as storage } from "./awsServerless";
import { zyrokS3 } from "./awsSimple";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertVideoSchema, insertCommentSchema } from "@shared/schema";
import { registerSearchRoutes } from "./routes/search";
import { registerMusicRoutes } from "./routes/music";
import { 
  generateVideoDescription, 
  generateHashtags, 
  generateVideoTitle,
  enhanceVideoMetadata,
  generateContentIdeas,
  analyzeVideoPerformance
} from "./openai";
import multer from "multer";
import path from "path";
import fs from "fs-extra";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for AWS S3 buffer access
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Register search routes
  registerSearchRoutes(app);
  
  // Register music routes
  registerMusicRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Video routes
  app.get("/api/videos", async (req, res) => {
    try {
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;
      const userId = req.isAuthenticated() ? (req.user as any)?.claims?.sub : undefined;
      
      const videos = await storage.getVideos(offset, limit, userId);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  // Video upload endpoint
  app.post("/api/videos/upload", isAuthenticated, upload.single("video"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "Video file is required" });
      }

      console.log("Processing video upload:", {
        userId,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

      let videoUrl: string;
      
      // Use AWS S3 for video storage if AWS is configured
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        try {
          videoUrl = await zyrokS3.uploadVideo(
            file.buffer, 
            file.originalname,
            file.mimetype
          );
          console.log("Video uploaded to AWS S3:", videoUrl);
        } catch (awsError) {
          console.error("AWS S3 upload failed, falling back to local storage:", awsError);
          // Fallback to local storage
          const fileName = `${Date.now()}-${file.originalname}`;
          const permanentPath = path.join("uploads", fileName);
          fs.ensureDirSync(path.dirname(permanentPath));
          fs.writeFileSync(permanentPath, file.buffer);
          videoUrl = `/uploads/${fileName}`;
          console.log("Video saved locally:", permanentPath);
        }
      } else {
        // Fallback to local storage
        const fileName = `${Date.now()}-${file.originalname}`;
        const permanentPath = path.join("uploads", fileName);
        fs.ensureDirSync(path.dirname(permanentPath));
        fs.writeFileSync(permanentPath, file.buffer);
        videoUrl = `/uploads/${fileName}`;
        console.log("Video saved locally:", permanentPath);
      }

      const videoData = insertVideoSchema.parse({
        userId,
        title: req.body.title || "Untitled Video",
        description: req.body.description || "",
        videoUrl,
        thumbnailUrl: req.body.thumbnailUrl,
        duration: parseInt(req.body.duration) || null,
        soundName: req.body.soundName,
        soundUrl: req.body.soundUrl,
        isAiEnhanced: req.body.isAiEnhanced === "true",
        sourceType: req.body.sourceType || "original",
        sourceUrl: req.body.sourceUrl,
      });

      const video = await storage.createVideo(videoData);
      console.log("Video created successfully:", video);
      res.json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ message: "Failed to create video", error: error.message });
    }
  });

  // Alternative endpoint for compatibility
  app.post("/api/videos", isAuthenticated, upload.single("video"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "Video file is required" });
      }

      let videoUrl: string;
      
      // Use AWS S3 for video storage if AWS is configured
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        try {
          videoUrl = await zyrokS3.uploadVideo(
            file.buffer, 
            file.originalname,
            file.mimetype
          );
          console.log("Video uploaded to AWS S3:", videoUrl);
        } catch (awsError) {
          console.error("AWS S3 upload failed, falling back to local storage:", awsError);
          // Fallback to local storage
          const fileName = `${Date.now()}-${file.originalname}`;
          const permanentPath = path.join("uploads", fileName);
          fs.moveSync(file.path, permanentPath);
          videoUrl = `/uploads/${fileName}`;
        }
      } else {
        // Fallback to local storage
        const fileName = `${Date.now()}-${file.originalname}`;
        const permanentPath = path.join("uploads", fileName);
        fs.moveSync(file.path, permanentPath);
        videoUrl = `/uploads/${fileName}`;
      }

      const videoData = insertVideoSchema.parse({
        userId,
        title: req.body.title || "Untitled Video",
        description: req.body.description || "",
        videoUrl,
        thumbnailUrl: req.body.thumbnailUrl,
        duration: parseInt(req.body.duration) || null,
        soundName: req.body.soundName,
        soundUrl: req.body.soundUrl,
        isAiEnhanced: req.body.isAiEnhanced === "true",
        sourceType: req.body.sourceType || "original",
        sourceUrl: req.body.sourceUrl,
      });

      const video = await storage.createVideo(videoData);
      console.log("Video created successfully:", video);
      res.json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ message: "Failed to create video", error: error.message });
    }
  });

  app.delete("/api/videos/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const videoId = parseInt(req.params.id);
      
      const deleted = await storage.deleteVideo(videoId, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Video not found or unauthorized" });
      }
      
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  // Comment routes
  app.get("/api/videos/:id/comments", async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const comments = await storage.getCommentsByVideo(videoId, offset, limit);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/videos/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const videoId = parseInt(req.params.id);
      
      const commentData = insertCommentSchema.parse({
        videoId,
        userId,
        content: req.body.content,
        parentId: req.body.parentId || null,
      });

      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Like routes
  app.post("/api/videos/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const videoId = parseInt(req.params.id);
      
      const isLiked = await storage.toggleLike(userId, videoId);
      res.json({ isLiked });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.post("/api/comments/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentId = parseInt(req.params.id);
      
      const isLiked = await storage.toggleLike(userId, undefined, commentId);
      res.json({ isLiked });
    } catch (error) {
      console.error("Error toggling comment like:", error);
      res.status(500).json({ message: "Failed to toggle comment like" });
    }
  });

  // Follow routes
  app.post("/api/users/:id/follow", isAuthenticated, async (req: any, res) => {
    try {
      const followerId = req.user.claims.sub;
      const followingId = req.params.id;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const isFollowing = await storage.toggleFollow(followerId, followingId);
      res.json({ isFollowing });
    } catch (error) {
      console.error("Error toggling follow:", error);
      res.status(500).json({ message: "Failed to toggle follow" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:id/videos", async (req, res) => {
    try {
      const userId = req.params.id;
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const videos = await storage.getVideosByUser(userId, offset, limit);
      res.json(videos);
    } catch (error) {
      console.error("Error fetching user videos:", error);
      res.status(500).json({ message: "Failed to fetch user videos" });
    }
  });

  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const userId = req.params.id;
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const followers = await storage.getFollowers(userId, offset, limit);
      res.json(followers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const userId = req.params.id;
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const following = await storage.getFollowing(userId, offset, limit);
      res.json(following);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // Search routes
  app.get("/api/search/users", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const users = await storage.searchUsers(query, 20);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get("/api/search/videos", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const videos = await storage.searchVideos(query, 20);
      res.json(videos);
    } catch (error) {
      console.error("Error searching videos:", error);
      res.status(500).json({ message: "Failed to search videos" });
    }
  });

  // AI routes (Pro features)
  app.post("/api/ai/generate-description", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isProUser) {
        return res.status(403).json({ message: "Pro subscription required" });
      }

      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const description = await generateVideoDescription(prompt);
      res.json({ description });
    } catch (error) {
      console.error("Error generating description:", error);
      res.status(500).json({ message: "Failed to generate description" });
    }
  });

  app.post("/api/ai/generate-hashtags", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isProUser) {
        return res.status(403).json({ message: "Pro subscription required" });
      }

      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }

      const hashtags = await generateHashtags(content);
      res.json({ hashtags });
    } catch (error) {
      console.error("Error generating hashtags:", error);
      res.status(500).json({ message: "Failed to generate hashtags" });
    }
  });

  app.post("/api/ai/enhance-metadata", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isProUser) {
        return res.status(403).json({ message: "Pro subscription required" });
      }

      const { title, description, tags } = req.body;
      const enhanced = await enhanceVideoMetadata({ title, description, tags });
      res.json(enhanced);
    } catch (error) {
      console.error("Error enhancing metadata:", error);
      res.status(500).json({ message: "Failed to enhance metadata" });
    }
  });

  app.post("/api/ai/content-ideas", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isProUser) {
        return res.status(403).json({ message: "Pro subscription required" });
      }

      const { category, interests } = req.body;
      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      const ideas = await generateContentIdeas(category, interests || []);
      res.json(ideas);
    } catch (error) {
      console.error("Error generating content ideas:", error);
      res.status(500).json({ message: "Failed to generate content ideas" });
    }
  });

  app.post("/api/ai/analyze-performance", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isProUser) {
        return res.status(403).json({ message: "Pro subscription required" });
      }

      const { videoId } = req.body;
      if (!videoId) {
        return res.status(400).json({ message: "Video ID is required" });
      }

      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const analysis = await analyzeVideoPerformance({
        views: video.viewsCount || 0,
        likes: video.likesCount || 0,
        comments: video.commentsCount || 0,
        shares: video.sharesCount || 0,
        description: video.description || "",
        hashtags: [], // Extract from description in real implementation
      });

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing performance:", error);
      res.status(500).json({ message: "Failed to analyze performance" });
    }
  });

  // Content aggregation routes (mocked for MVP)
  app.get("/api/aggregation/tiktok", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isProUser) {
        return res.status(403).json({ message: "Pro subscription required" });
      }

      // Mock TikTok content aggregation
      res.json({
        message: "TikTok content aggregation would be implemented here",
        status: "mocked",
        videos: []
      });
    } catch (error) {
      console.error("Error aggregating TikTok content:", error);
      res.status(500).json({ message: "Failed to aggregate TikTok content" });
    }
  });

  app.get("/api/aggregation/instagram", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isProUser) {
        return res.status(403).json({ message: "Pro subscription required" });
      }

      // Mock Instagram content aggregation
      res.json({
        message: "Instagram content aggregation would be implemented here",
        status: "mocked",
        videos: []
      });
    } catch (error) {
      console.error("Error aggregating Instagram content:", error);
      res.status(500).json({ message: "Failed to aggregate Instagram content" });
    }
  });

  app.get("/api/aggregation/youtube", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isProUser) {
        return res.status(403).json({ message: "Pro subscription required" });
      }

      // Mock YouTube content aggregation
      res.json({
        message: "YouTube content aggregation would be implemented here",
        status: "mocked",
        videos: []
      });
    } catch (error) {
      console.error("Error aggregating YouTube content:", error);
      res.status(500).json({ message: "Failed to aggregate YouTube content" });
    }
  });

  // Serve uploaded files
  // Download complete project route
  app.get("/download/complete-project", async (req, res) => {
    try {
      const { execSync } = require('child_process');
      const archivePath = '/tmp/zyrok-complete-project.tar.gz';
      
      // Create archive excluding unnecessary files
      execSync(`cd /home/runner/workspace && tar -czf ${archivePath} --exclude=node_modules --exclude=.git --exclude=dist --exclude=uploads --exclude=.replit --exclude=replit.nix --exclude=.cache --exclude=.local .`);
      
      res.download(archivePath, 'zyrok-complete-project.tar.gz', (err) => {
        if (err) {
          console.error('Download error:', err);
          res.status(500).send('Download failed');
        }
        // Clean up temporary file
        try {
          require('fs').unlinkSync(archivePath);
        } catch (cleanupErr) {
          console.warn('Could not clean up temp file:', cleanupErr);
        }
      });
    } catch (error) {
      console.error('Archive creation error:', error);
      res.status(500).send('Failed to create archive');
    }
  });

  app.use("/uploads", express.static("uploads"));

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time features
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/ws"
  });

  // WebSocket authentication middleware
  io.use(async (socket: any, next: any) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        // In a real app, validate the token here
        socket.userId = token;
      }
      next();
    } catch (error) {
      next(new Error("Authentication failed"));
    }
  });

  // Real-time event handlers
  io.on("connection", (socket: any) => {
    console.log(`User connected: ${socket.userId}`);

    // Join video room for real-time comments
    socket.on("join-video", (videoId: string) => {
      socket.join(`video-${videoId}`);
      console.log(`User ${socket.userId} joined video ${videoId}`);
    });

    // Leave video room
    socket.on("leave-video", (videoId: string) => {
      socket.leave(`video-${videoId}`);
      console.log(`User ${socket.userId} left video ${videoId}`);
    });

    // Real-time comment
    socket.on("new-comment", async (data: any) => {
      try {
        const { videoId, content } = data;
        if (!socket.userId) return;

        await storage.createComment({
          videoId: parseInt(videoId),
          userId: socket.userId,
          content
        });

        // Get comment with user data
        const commentWithUser = await storage.getCommentsByVideo(parseInt(videoId), 0, 1);
        const newComment = commentWithUser[0];

        // Broadcast to all users watching this video
        io.to(`video-${videoId}`).emit("comment-added", newComment);
      } catch (error) {
        console.error("Error creating real-time comment:", error);
        socket.emit("error", { message: "Failed to post comment" });
      }
    });

    // Real-time like
    socket.on("toggle-like", async (data: any) => {
      try {
        const { videoId, commentId } = data;
        if (!socket.userId) return;

        const isLiked = await storage.toggleLike(socket.userId, videoId ? parseInt(videoId) : undefined, commentId ? parseInt(commentId) : undefined);
        
        // Update video stats if it's a video like
        if (videoId && !commentId) {
          await storage.updateVideoStats(parseInt(videoId));
          const video = await storage.getVideo(parseInt(videoId));
          
          // Broadcast like update to all users watching this video
          io.to(`video-${videoId}`).emit("like-updated", {
            videoId,
            isLiked,
            likesCount: video?.likesCount || 0
          });
        }
      } catch (error) {
        console.error("Error toggling like:", error);
        socket.emit("error", { message: "Failed to update like" });
      }
    });

    // Real-time follow
    socket.on("toggle-follow", async (data: any) => {
      try {
        const { userId: targetUserId } = data;
        if (!socket.userId) return;

        const isFollowing = await storage.toggleFollow(socket.userId, targetUserId);
        
        // Notify the followed user
        io.emit("follow-updated", {
          followerId: socket.userId,
          followingId: targetUserId,
          isFollowing
        });
      } catch (error) {
        console.error("Error toggling follow:", error);
        socket.emit("error", { message: "Failed to update follow" });
      }
    });

    // User typing indicator for comments
    socket.on("typing", (data: any) => {
      const { videoId, isTyping } = data;
      socket.to(`video-${videoId}`).emit("user-typing", {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  // Serve demo upload page
  app.get("/demo", (req, res) => {
    res.sendFile(path.join(process.cwd(), "demo-upload.html"));
  });

  return httpServer;
}

// Simple recommendation algorithm
function calculateRecommendationScore(video: any, userId: string): number {
  let score = 0;
  
  // Recent videos get boost
  const hoursOld = (Date.now() - new Date(video.createdAt).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 100 - hoursOld); // Decay over time
  
  // Engagement metrics
  score += (video.likesCount || 0) * 2;
  score += (video.commentsCount || 0) * 3;
  score += (video.viewCount || 0) * 0.1;
  
  // Randomness for discovery
  score += Math.random() * 50;
  
  // Avoid user's own videos
  if (video.userId === userId) {
    score *= 0.1;
  }
  
  return score;
}
