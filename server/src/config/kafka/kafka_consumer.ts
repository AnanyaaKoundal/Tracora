import { Consumer, EachMessagePayload } from "kafkajs";
import kafka from "@/config/kafka/kafka";
import { createNotification } from "@/services/notification.service";
import { broadcastNotification } from "../../../index";
import Comment from "@/models/comment.model";

interface NotificationMessage {
  receiverId: string[];
  bug_id: string;
  senderId?: string;
  message?: string;
  createdAt?: string;
  _id?: string;
}

class NotificationConsumer {
  private consumer: Consumer;
  private topics: string[] = ["comment-topic", "bug-created-topic", "bug-status-changed-topic", "bug-assigned-topic"];
  private groupId: string = "notification-consumer-group";
  private isConnected: boolean = false;

  constructor() {
    this.consumer = kafka.consumer({
      groupId: this.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      console.log(`✅ Notification Consumer connected (Group: ${this.groupId})`);
    } catch (error) {
      console.error("❌ Failed to connect Notification Consumer:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log("🔌 Notification Consumer disconnected");
    }
  }

  async subscribe(): Promise<void> {
    try {
      for (const topic of this.topics) {
        await this.consumer.subscribe({
          topic,
          fromBeginning: false,
        });
        console.log(`📨 Subscribed to topic: ${topic}`);
      }
    } catch (error) {
      console.error(`❌ Failed to subscribe to topics:`, error);
      throw error;
    }
  }

  async startConsuming(): Promise<void> {
    try {
      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      console.log(`🚀 Notification Consumer started on topics: ${this.topics.join(", ")}`);
    } catch (error) {
      console.error("❌ Error starting consumer:", error);
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const value = message.value?.toString();

      if (!value) {
        console.warn("⚠️ Received empty message");
        return;
      }

      const parsedMessage = JSON.parse(value);
      console.log("📬 Kafka Message Received:", {
        topic,
        partition,
        offset: message.offset,
        data: parsedMessage,
      });

      switch (topic) {
        case "comment-topic":
          await this.processCommentNotification(parsedMessage.newComment);
          break;
        case "bug-created-topic":
          await this.processBugCreatedNotification(parsedMessage);
          break;
        case "bug-status-changed-topic":
          await this.processStatusChangedNotification(parsedMessage);
          break;
        case "bug-assigned-topic":
          await this.processBugAssignedNotification(parsedMessage);
          break;
        default:
          console.warn(`⚠️ Unknown topic: ${topic}`);
      }

    } catch (error) {
      console.error("❌ Error handling message:", error);
      await this.handleError(message, error);
    }
  }

  private async processCommentNotification(
    notification: NotificationMessage
  ): Promise<void> {
    try {
      const comment = await Comment.findById(notification._id).select("seen");

      if (!comment) {
        console.warn("Comment not found for notification!!!!");
        return;
      }

      for (const userId of notification.receiverId) {
        if (comment.seen?.get(userId)) {
          console.log(`👀 Skipping notification, already seen by ${userId}`);
          continue;
        }

        const notificationDoc = await createNotification({
          participants: userId,
          message:
            notification.message ||
            `${notification.senderId} commented on bug ${notification.bug_id}`,
          reference_id: notification.bug_id,
          sender_id: notification.senderId,
          type: "COMMENT",
        });

        broadcastNotification(userId, notificationDoc);
        console.log(`✅ Notification created for ${userId}`);
      }
    } catch (error) {
      console.error("❌ Error processing comment notification:", error);
      throw error;
    }
  }

  private async processBugCreatedNotification(data: any): Promise<void> {
    try {
      const { bug, senderId, senderName } = data;
      
      for (const userId of bug.notify_users) {
        const notificationDoc = await createNotification({
          participants: userId,
          message: `${senderName} created a new bug: ${bug.bug_name}`,
          reference_id: bug.bug_id,
          reference_name: bug.bug_name,
          sender_id: senderId,
          sender_name: senderName,
          type: "BUG_CREATED",
        });

        broadcastNotification(userId, notificationDoc);
        console.log(`✅ Bug created notification sent to ${userId}`);
      }
    } catch (error) {
      console.error("❌ Error processing bug created notification:", error);
      throw error;
    }
  }

  private async processStatusChangedNotification(data: any): Promise<void> {
    try {
      const { bug, senderId, senderName, oldStatus, newStatus } = data;

      for (const userId of bug.notify_users) {
        const notificationDoc = await createNotification({
          participants: userId,
          message: `${senderName} changed bug "${bug.bug_name}" status from ${oldStatus} to ${newStatus}`,
          reference_id: bug.bug_id,
          reference_name: bug.bug_name,
          sender_id: senderId,
          sender_name: senderName,
          type: "STATUS_CHANGED",
        });

        broadcastNotification(userId, notificationDoc);
        console.log(`✅ Status changed notification sent to ${userId}`);
      }
    } catch (error) {
      console.error("❌ Error processing status changed notification:", error);
      throw error;
    }
  }

  private async processBugAssignedNotification(data: any): Promise<void> {
    try {
      const { bug, senderId, senderName, newAssignee } = data;

      if (!newAssignee) {
        console.warn("No new assignee provided");
        return;
      }

      const notificationDoc = await createNotification({
        participants: newAssignee,
        message: `${senderName} assigned you to bug: ${bug.bug_name}`,
        reference_id: bug.bug_id,
        reference_name: bug.bug_name,
        sender_id: senderId,
        sender_name: senderName,
        type: "ASSIGNED",
      });

      broadcastNotification(newAssignee, notificationDoc);
      console.log(`✅ Assignment notification sent to ${newAssignee}`);
    } catch (error) {
      console.error("❌ Error processing assignment notification:", error);
      throw error;
    }
  }

  private async handleError(message: any, error: any): Promise<void> {
    console.error("🔥 Error processing Kafka message:", {
      offset: message.offset,
      key: message.key?.toString(),
      value: message.value?.toString(),
      error: error.message,
      stack: error.stack,
    });
  }

  isConsumerConnected(): boolean {
    return this.isConnected;
  }
}

export const notificationConsumer = new NotificationConsumer();
export default NotificationConsumer;