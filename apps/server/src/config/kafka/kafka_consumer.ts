import { Consumer, EachMessagePayload } from "kafkajs";
import kafka from "@/config/kafka/kafka";
import { createNotification } from "@/services/notification.service";
import { broadcastNotification } from "../../../index";

interface NotificationMessage {
  receiverId: string[];
  bug_id: string;
  senderId?: string;
  message?: string;
  reference_name?: string;
  createdAt?: string;
}

class NotificationConsumer {
  private consumer: Consumer;
  private topic: string = "comment-topic";
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
      await this.consumer.subscribe({
        topic: this.topic,
        fromBeginning: false,
      });

      console.log(`📨 Subscribed to topic: ${this.topic}`);
    } catch (error) {
      console.error(`❌ Failed to subscribe to topic ${this.topic}:`, error);
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

      console.log(`🚀 Notification Consumer started on topic: ${this.topic}`);
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

      const notification: NotificationMessage = parsedMessage.newComment;

      await this.processNotification(notification);

    } catch (error) {
      console.error("❌ Error handling message:", error);
      await this.handleError(message, error);
    }
  }

  private async processNotification(
    notification: NotificationMessage
  ): Promise<void> {
    try {
      console.log("NNNNN", notification);
      for (const userId of notification.receiverId) {
  
        const notificationDoc = await createNotification({
          participants: [userId],
          message:
            notification.message ||
            `${notification.senderId} commented on bug ${notification.bug_id}`,
          reference_id: notification.bug_id,
          sender_id: notification.senderId
        });
  
        // 🔔 Send realtime websocket notification
        broadcastNotification(userId, notificationDoc);
  
        console.log(`✅ Notification processed for user: ${userId}`);
      }
  
    } catch (error) {
      console.error("❌ Error processing notification:", error);
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