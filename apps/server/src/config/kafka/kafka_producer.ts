import { Producer, ProducerRecord, RecordMetadata } from 'kafkajs';
import kafka from '@/config/kafka/kafka';

class KafkaProducer {
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.producer = kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('✅ Kafka Producer connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect Kafka Producer:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('🔌 Kafka Producer disconnected');
    }
  }

  /**
   * Send a single message to a topic
   */
  async send(topic: string, message: any, key?: string): Promise<RecordMetadata[]> {
    try {
      const result = await this.producer.send({
        topic,
        messages: [
          {
            key: key || null,
            value: JSON.stringify(message),
            headers: {
              'content-type': 'application/json',
              timestamp: new Date().toISOString()
            }
          }
        ]
      });
      
      console.log(`📤 Message sent to topic "${topic}":`, result);
      return result;
    } catch (error) {
      console.error(`❌ Error sending message to topic "${topic}":`, error);
      throw error;
    }
  }

  /**
   * Send multiple messages to a topic
   */
  // async sendBatch(topic: string, messages: any[], keys?: string[]): Promise<RecordMetadata[]> {
  //   try {
  //     const formattedMessages = messages.map((message, index) => ({
  //       key: keys && keys[index] ? keys[index] : null,
  //       value: JSON.stringify(message),
  //       headers: {
  //         'content-type': 'application/json',
  //         timestamp: new Date().toISOString()
  //       }
  //     }));

  //     const result = await this.producer.send({
  //       topic,
  //       messages: formattedMessages
  //     });

  //     console.log(`📤 Batch messages sent to topic "${topic}":`, result);
  //     return result;
  //   } catch (error) {
  //     console.error(`❌ Error sending batch messages to topic "${topic}":`, error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Send message with custom configuration
  //  */
  // async sendWithConfig(producerRecord: ProducerRecord): Promise<RecordMetadata[]> {
  //   try {
  //     const result = await this.producer.send(producerRecord);
  //     console.log('📤 Custom message sent:', result);
  //     return result;
  //   } catch (error) {
  //     console.error('❌ Error sending custom message:', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Send message to multiple partitions
  //  */
  // async sendToPartition(
  //   topic: string,
  //   partition: number,
  //   message: any,
  //   key?: string
  // ): Promise<RecordMetadata[]> {
  //   try {
  //     const result = await this.producer.send({
  //       topic,
  //       messages: [
  //         {
  //           key: key || null,
  //           value: JSON.stringify(message),
  //           partition,
  //           headers: {
  //             'content-type': 'application/json'
  //           }
  //         }
  //       ]
  //     });

  //     console.log(`📤 Message sent to topic "${topic}" partition ${partition}`);
  //     return result;
  //   } catch (error) {
  //     console.error(`❌ Error sending message to partition:`, error);
  //     throw error;
  //   }
  // }

  /**
   * Check if producer is connected
   */
  isProducerConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance - can be used across the application
export const kafkaProducer = new KafkaProducer();
export default KafkaProducer;