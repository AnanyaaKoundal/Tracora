import { Router } from 'express';
import { kafkaProducer } from '@/config/kafka_producer';

const router = Router();

router.post('/notify', async (req, res) => {
  try {
    const { type, recipient, title, message } = req.body;

    await kafkaProducer.send('notifications', {
      type,
      recipient,
      title,
      message,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send' });
  }
});

export default router;