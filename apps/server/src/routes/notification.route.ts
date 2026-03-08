import { markNotificationReadController } from '@/controllers/notification/notification.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import {Router} from 'express';

const router = Router();

router.route("/markAsRead").post(authenticate, markNotificationReadController)

export default router