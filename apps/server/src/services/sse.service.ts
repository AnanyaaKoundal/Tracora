import { Request, Response, NextFunction } from "express";
import { Subject } from "rxjs";
import { finalize, filter } from "rxjs/operators";
import ApiError from "@/utils/ApiError"

export type NotificationSource = "notification" | "alert" | "update" | "message";

interface BroadcastData {
  receivers: string[];
  message: any;
  source: NotificationSource;
}

interface SSEEvent {
  data: any;
  source: NotificationSource;
  timestamp?: string;
}

class SseService {
  private static instance: SseService;
  private subjects: Record<string, Subject<SSEEvent>> = {};
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds

  private constructor() {
    this.startHeartbeat();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SseService {
    if (!SseService.instance) {
      SseService.instance = new SseService();
    }
    return SseService.instance;
  }

  /**
   * Subscribe user to SSE stream
   * Route: GET /notifications/stream/:id?source=notification
   */
  public subscribe = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      console.log("🔌 User connecting to SSE");
      
      const userId = req.params.id;
      const source = req.query.source as NotificationSource;

      // Validate userId
      if (!userId) {
        throw new ApiError(400, "User ID is required!");
      }

      // Validate source
      const validSources: NotificationSource[] = ["notification", "alert", "update", "message"];
      if (!source || !validSources.includes(source)) {
        throw new ApiError(
          400,
          `Invalid source parameter! Must be one of: ${validSources.join(", ")}`
        );
      }

      console.log(`✅ User ${userId} subscribed to ${source} events`);

      // Create subject for user if it doesn't exist
      if (!this.subjects[userId]) {
        this.subjects[userId] = new Subject<SSEEvent>();
        console.log(`[INFO] Created subject for user: ${userId}`);
      }

      console.log(
        `[INFO] Current subscribers: ${Object.keys(this.subjects).join(", ")}`
      );
      console.log(`[INFO] Total active connections: ${this.getTotalConnections()}`);

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
      res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

      // Send initial connection message
      res.write(
        `data: ${JSON.stringify({
          type: "connected",
          message: "Connected to SSE stream",
          source,
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      // Subscribe to user's subject with source filter
      const subscription = this.subjects[userId]
        .asObservable()
        .pipe(
          filter((event) => event?.source === source),
          finalize(() => {
            console.log(`[INFO] Finalizing subscription for user: ${userId}`);
            this.cleanUpUser(userId);
          })
        )
        .subscribe({
          next: (event) => {
            try {
              res.write(`data: ${JSON.stringify(event)}\n\n`);
            } catch (error) {
              console.error(
                `[ERROR] Failed to write to user ${userId}:`,
                (error as Error).message
              );
            }
          },
          error: (error) => {
            console.error(
              `[ERROR] Observable error for user ${userId}:`,
              error
            );
          },
        });

      // Handle client disconnect
      res.on("close", () => {
        console.log(`❌ User ${userId} disconnected from ${source} stream`);
        subscription.unsubscribe();
        res.end();
      });

      // Handle errors
      res.on("error", (error) => {
        console.error(`[ERROR] Connection error for user ${userId}:`, error);
        subscription.unsubscribe();
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Broadcast message to multiple users
   */
  public async broadcastToUsers(
    data: BroadcastData
  ): Promise<{ success: boolean; message: string; sentCount: number }> {
    console.log("📢 Broadcasting to users...");
    const { receivers, message, source } = data;

    console.log(
      `[INFO] Connected users: ${Object.keys(this.subjects).join(", ")}`
    );
    console.log(`📢 Broadcasting from '${source}' to: ${receivers.join(", ")}`);

    let sentCount = 0;

    await Promise.all(
      receivers.map(async (userId) => {
        if (this.subjects[userId]) {
          try {
            console.log(`[INFO] Sending message to user: ${userId}`);

            this.subjects[userId].next({
              data: message,
              source,
              timestamp: new Date().toISOString(),
            });

            sentCount++;
          } catch (error) {
            console.error(
              `[ERROR] Failed to broadcast to user ${userId}:`,
              (error as Error).message
            );
          }
        } else {
          console.log(`[WARN] User ${userId} not connected`);
        }
      })
    );

    console.log(`✅ Broadcast complete. Sent to ${sentCount}/${receivers.length} users`);

    return {
      success: true,
      message: "Broadcasted successfully",
      sentCount,
    };
  }

  /**
   * Broadcast to all connected users
   */
  public async broadcastToAll(
    message: any,
    source: NotificationSource
  ): Promise<{ success: boolean; message: string; sentCount: number }> {
    const allUserIds = Object.keys(this.subjects);
    return this.broadcastToUsers({
      receivers: allUserIds,
      message,
      source,
    });
  }

  /**
   * Send message to a single user
   */
  public async sendToUser(
    userId: string,
    message: any,
    source: NotificationSource
  ): Promise<{ success: boolean; message: string }> {
    if (!this.subjects[userId]) {
      console.log(`[WARN] User ${userId} not connected`);
      return { success: false, message: "User not connected" };
    }

    try {
      this.subjects[userId].next({
        data: message,
        source,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ Sent message to user: ${userId}`);
      return { success: true, message: "Message sent successfully" };
    } catch (error) {
      console.error(
        `[ERROR] Failed to send to user ${userId}:`,
        (error as Error).message
      );
      return { success: false, message: "Failed to send message" };
    }
  }

  /**
   * Send heartbeat to all connected users
   */
  private sendHeartbeat(): void {
    const connectedUsers = Object.keys(this.subjects);
    
    if (connectedUsers.length === 0) return;

    console.log(`💓 Sending heartbeat to ${connectedUsers.length} users`);

    connectedUsers.forEach((userId) => {
      try {
        // Send heartbeat to all sources this user might be subscribed to
        const heartbeatEvent: SSEEvent = {
          data: { 
            type: "heartbeat",
            timestamp: new Date().toISOString() 
          },
          source: "notification", // Default source for heartbeat
          timestamp: new Date().toISOString(),
        };

        this.subjects[userId].next(heartbeatEvent);
      } catch (error) {
        console.error(`[ERROR] Failed to send heartbeat to ${userId}:`, error);
      }
    });
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);

    console.log("💓 SSE Heartbeat started");
  }

  /**
   * Stop heartbeat interval
   */
  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log("💔 SSE Heartbeat stopped");
    }
  }

  /**
   * Clean up a specific user's subscription
   */
  public async cleanUpUser(userId: string): Promise<void> {
    if (this.subjects[userId]) {
      console.log(`🗑️ Cleaning up user ${userId}`);
      this.subjects[userId].complete();
      delete this.subjects[userId];
      console.log(`[INFO] Remaining connections: ${this.getTotalConnections()}`);
    }
  }

  /**
   * Clean up all subscriptions
   */
  public async cleanUpAll(): Promise<{ success: boolean; message: string }> {
    console.log("🗑️ Cleaning up all subscriptions");

    const userIds = Object.keys(this.subjects);
    await Promise.all(userIds.map((userId) => this.cleanUpUser(userId)));

    this.stopHeartbeat();

    console.log("✅ All users cleaned up");

    return { success: true, message: "All users cleaned up" };
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    return !!this.subjects[userId];
  }

  /**
   * Get total number of connections
   */
  public getTotalConnections(): number {
    return Object.keys(this.subjects).length;
  }

  /**
   * Get all connected user IDs
   */
  public getConnectedUsers(): string[] {
    return Object.keys(this.subjects);
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    totalConnections: number;
    connectedUsers: string[];
    timestamp: string;
  } {
    return {
      totalConnections: this.getTotalConnections(),
      connectedUsers: this.getConnectedUsers(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get subjects (for testing/debugging)
   */
  public getSubjects(): Record<string, Subject<SSEEvent>> {
    return this.subjects;
  }
}

export default SseService.getInstance();