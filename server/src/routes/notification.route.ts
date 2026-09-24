import { fetchNotificationForUserController, markNotificationReadController } from '@/controllers/notification/notification.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import {Router} from 'express';

const router = Router();

router.route("/markAsRead").post(authenticate, markNotificationReadController);
router.route("/getNotifications").get(authenticate, fetchNotificationForUserController);

export default router