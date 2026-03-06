import kafka from "./kafka";
import { notificationConsumer } from "./kafka_consumer";
import { kafkaProducer } from "./kafka_producer";

// Helper function to wait for Kafka to be ready
async function waitForKafka(maxAttempts = 10, delayMs = 3000): Promise<void> {
  const admin = kafka.admin();
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔄 Attempting to connect to Kafka (${attempt}/${maxAttempts})...`);
      await admin.connect();
      await admin.listTopics(); // Verify connection works
      await admin.disconnect();
      console.log('✅ Kafka is ready!');
      return;
    } catch (error) {
      console.log(`⏳ Kafka not ready yet, waiting ${delayMs}ms...`);
      await admin.disconnect().catch(() => {}); // Ensure cleanup
      
      if (attempt === maxAttempts) {
        throw new Error(`Failed to connect to Kafka after ${maxAttempts} attempts`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

export async function initializeKafka() {
  try {
    // Wait for Kafka to be ready
    await waitForKafka();
    
    // Create admin client for topic management
    const admin = kafka.admin();
    await admin.connect();
    console.log('✅ Kafka admin connected');
    
    // Ensure topic exists
    const topic = 'comment-topic';
    
    try {
      await admin.createTopics({
        topics: [
          {
            topic,
            numPartitions: 1,
            replicationFactor: 1
          }
        ],
        waitForLeaders: true
      });
      console.log(`📌 Kafka topic created: ${topic}`);
    } catch (error: any) {
      // Topic might already exist, check if it's that error
      if (error.type === 'TOPIC_ALREADY_EXISTS') {
        console.log(`📌 Kafka topic already exists: ${topic}`);
      } else {
        throw error;
      }
    }
    
    await admin.disconnect();
    console.log('✅ Kafka admin disconnected');
    
    // Initialize producer
    await kafkaProducer.connect();
    console.log('✅ Kafka producer connected');
    
    // Initialize notification consumer
    await notificationConsumer.connect();
    console.log('✅ Kafka consumer connected');
    
    await notificationConsumer.subscribe();
    console.log('✅ Kafka consumer subscribed');
    
    await notificationConsumer.startConsuming();
    console.log('✅ Kafka consumer started');
    
    console.log('🚀 Kafka initialized successfully');
  } catch (error) {
    console.error('❌ Kafka initialization failed:', error);
    throw error;
  }
}

export async function shutdownKafka() {
  try {
    console.log('🔄 Shutting down Kafka connections...');
    await kafkaProducer.disconnect();
    console.log('✅ Kafka producer disconnected');
    await notificationConsumer.disconnect();
    console.log('✅ Kafka consumer disconnected');
    console.log('✅ Kafka shutdown complete');
  } catch (error) {
    console.error('❌ Error during Kafka shutdown:', error);
    throw error;
  }
}