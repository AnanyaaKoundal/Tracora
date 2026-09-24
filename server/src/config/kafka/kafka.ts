import { Kafka, logLevel } from 'kafkajs';

const brokers = process.env.KAFKA_BROKERS 
  ? [process.env.KAFKA_BROKERS] 
  : ['localhost:9092'];

const kafka = new Kafka({
  brokers,
  clientId: 'notification-service',
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 300,
    retries: 10,
    maxRetryTime: 30000,
    multiplier: 2
  },
  connectionTimeout: 10000,
  requestTimeout: 30000
});

export default kafka;