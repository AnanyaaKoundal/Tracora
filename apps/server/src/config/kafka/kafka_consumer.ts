import { Consumer, EachMessagePayload } from 'kafkajs';
import kafka from '@/config/kafka/kafka';
import { createNotification } from '@/services/notification.service';

interface NotificationMessage {
  receiverId: string;
  bug_id: string;
  message?: string;
  reference_name?: string;
  createdAt?: string;
}

class NotificationConsumer {
  private consumer: Consumer;
  private topic: string = 'comment-topic';
  private groupId: string = 'notification-consumer-group';
  private isConnected: boolean = false;

  constructor() {
    this.consumer = kafka.consumer({ 
      groupId: this.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
  }

  async connect(): Promise<void> {
    try {
      await this.consumer.connect();
      this.isConnected = true;
      console.log(`✅ Notification Consumer connected (Group: ${this.groupId})`);
    } catch (error) {
      console.error('❌ Failed to connect Notification Consumer:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('🔌 Notification Consumer disconnected');
    }
  }

  async subscribe(): Promise<void> {
    try {
      await this.consumer.subscribe({ 
        topic: this.topic, 
        fromBeginning: false
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
        }
      });
      console.log(`🚀 Notification Consumer started on topic: ${this.topic}`);
    } catch (error) {
      console.error('❌ Error starting consumer:', error);
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      const value = message.value?.toString();
      
      if (!value) {
        console.warn('⚠️ Received empty message');
        return;
      }

      const notification = JSON.parse(value);
      
      console.log('📬 Received Notification:', {
        topic,
        partition,
        offset: message.offset,
        key: message.key?.toString(),
        timestamp: message.timestamp,
        data: notification.newComment
      });

      await this.processNotification(notification.newComment);

    } catch (error) {
      console.error('❌ Error handling message:', error);
      await this.handleError(message, error);
    }
  }

  private async processNotification(notification: NotificationMessage): Promise<void> {

    try {
      await this.sendPushNotification(notification);
      console.log(`✅ Notification processed for: ${notification.receiverId}`);
    } catch (error) {
      console.error('❌ Error processing notification:', error);
      throw error;
    }
  }


  // Push notification handler
  private async sendPushNotification(notification: NotificationMessage): Promise<void> {
    console.log('🔔 Sending push notification:', {
      to: notification.receiverId,
      body: notification.message
    });
    
    createNotification({
      participants: notification.receiverId,
      message: notification.message,
      reference_id: notification.bug_id
    })
    
  }

  // In-app notification handler
  private async sendInAppNotification(notification: NotificationMessage): Promise<void> {
    console.log('💬 Sending in-app notification:', notification);

  }

  // Webhook notification handler
  private async sendWebhookNotification(notification: NotificationMessage): Promise<void> {
    console.log('🔗 Sending webhook notification:', notification);
  }

  // Default handler
  private async sendDefaultNotification(notification: NotificationMessage): Promise<void> {
    console.log('📢 Default notification handler:', notification);
    // Implement default behavior
  }

  // Error handler
  private async handleError(message: any, error: any): Promise<void> {
    console.error('🔥 Error processing message:', {
      offset: message.offset,
      key: message.key?.toString(),
      value: message.value?.toString(),
      error: error.message,
      stack: error.stack
    });
    
  }

  // Utility method
  isConsumerConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const notificationConsumer = new NotificationConsumer();
export default NotificationConsumer;