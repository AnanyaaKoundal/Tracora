import { z } from "zod";

export const NotificationSchema = z.object({
  _id: z.string().optional(),
  message: z.string(),
  reference_id: z.string().optional(),
  sender_name: z.string().optional(),
  createdAt: z.string().optional(),
  read: z.boolean().optional(),
  count: z.number().default(0),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationEventSchema = z.object({
  type: z.literal("notification"),
  notification: NotificationSchema,
});

export type NotificationEvent = z.infer<typeof NotificationEventSchema>;