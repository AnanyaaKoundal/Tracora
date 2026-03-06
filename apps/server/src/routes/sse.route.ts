import { Router, Request, Response } from "express";
import sseService from "@/services/sse.service";

const router = Router();

/**
 * SSE stream endpoint
 * GET /notifications/stream/:id?source=notification
 * 
 * @param id - User ID
 * @param source - notification | alert | update | message
 */
router.get("/stream/:id", sseService.subscribe);

/**
 * Get SSE connection statistics
 * GET /notifications/stats
 */
router.get("/stats", (req: Request, res: Response) => {
  try {
    const stats = sseService.getStats();
    res.json(stats);
  } catch (error) {
    console.error("❌ Error getting SSE stats:", error);
    res.status(500).json({ error: "Failed to get statistics" });
  }
});

// /**
//  * Check if user is connected
//  * GET /notifications/status/:userId
//  */
// router.get("/status/:userId", (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;
//     const isConnected = sseService.isUserConnected(userId);
    
//     res.json({
//       userId,
//       connected: isConnected,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("❌ Error checking user status:", error);
//     res.status(500).json({ error: "Failed to check user status" });
//   }
// });

// /**
//  * Send notification to a single user (for testing/manual trigger)
//  * POST /notifications/send/:userId
//  * 
//  * Body:
//  * {
//  *   "message": { ... },
//  *   "source": "notification" | "alert" | "update" | "message"
//  * }
//  */
// router.post("/send/:userId", async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;
//     const { message, source } = req.body;

//     if (!message) {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     if (!source) {
//       return res.status(400).json({ error: "Source is required" });
//     }

//     const result = await sseService.sendToUser(
//       userId,
//       message,
//       source as NotificationSource
//     );

//     res.json(result);
//   } catch (error) {
//     console.error("❌ Error sending notification:", error);
//     res.status(500).json({ error: "Failed to send notification" });
//   }
// });

// /**
//  * Broadcast to multiple users
//  * POST /notifications/broadcast
//  * 
//  * Body:
//  * {
//  *   "receivers": ["userId1", "userId2"],
//  *   "message": { ... },
//  *   "source": "notification" | "alert" | "update" | "message"
//  * }
//  */
// router.post("/broadcast", async (req: Request, res: Response) => {
//   try {
//     const { receivers, message, source } = req.body;

//     if (!receivers || !Array.isArray(receivers) || receivers.length === 0) {
//       return res.status(400).json({ error: "Receivers array is required" });
//     }

//     if (!message) {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     if (!source) {
//       return res.status(400).json({ error: "Source is required" });
//     }

//     const result = await sseService.broadcastToUsers({
//       receivers,
//       message,
//       source: source as NotificationSource,
//     });

//     res.json(result);
//   } catch (error) {
//     console.error("❌ Error broadcasting:", error);
//     res.status(500).json({ error: "Failed to broadcast notification" });
//   }
// });

// /**
//  * Broadcast to all connected users
//  * POST /notifications/broadcast-all
//  * 
//  * Body:
//  * {
//  *   "message": { ... },
//  *   "source": "notification" | "alert" | "update" | "message"
//  * }
//  */
// router.post("/broadcast-all", async (req: Request, res: Response) => {
//   try {
//     const { message, source } = req.body;

//     if (!message) {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     if (!source) {
//       return res.status(400).json({ error: "Source is required" });
//     }

//     const result = await sseService.broadcastToAll(
//       message,
//       source as NotificationSource
//     );

//     res.json(result);
//   } catch (error) {
//     console.error("❌ Error broadcasting to all:", error);
//     res.status(500).json({ error: "Failed to broadcast notification" });
//   }
// });

// /**
//  * Disconnect a specific user (admin endpoint)
//  * DELETE /notifications/disconnect/:userId
//  */
// router.delete("/disconnect/:userId", async (req: Request, res: Response) => {
//   try {
//     const { userId } = req.params;
//     await sseService.cleanUpUser(userId);
    
//     res.json({ 
//       success: true, 
//       message: `User ${userId} disconnected`,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("❌ Error disconnecting user:", error);
//     res.status(500).json({ error: "Failed to disconnect user" });
//   }
// });

// /**
//  * Disconnect all users (admin endpoint)
//  * DELETE /notifications/disconnect-all
//  */
// router.delete("/disconnect-all", async (req: Request, res: Response) => {
//   try {
//     const result = await sseService.cleanUpAll();
//     res.json(result);
//   } catch (error) {
//     console.error("❌ Error disconnecting all users:", error);
//     res.status(500).json({ error: "Failed to disconnect all users" });
//   }
// });

// /**
//  * Get list of connected users
//  * GET /notifications/connected-users
//  */
// router.get("/connected-users", (req: Request, res: Response) => {
//   try {
//     const connectedUsers = sseService.getConnectedUsers();
    
//     res.json({
//       count: connectedUsers.length,
//       users: connectedUsers,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("❌ Error getting connected users:", error);
//     res.status(500).json({ error: "Failed to get connected users" });
//   }
// });

export default router;