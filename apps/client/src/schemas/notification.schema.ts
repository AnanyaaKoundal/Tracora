import { z } from "zod";

export const NotificationSchema = z
  .object({
    _id: z.string(),
    message: z.string(),
    reference_id: z.string().optional(),
    sender_name: z.string().optional(),
    createdAt: z.string().optional(),

    // backend field
    readStatus: z.boolean().optional(),

    // frontend field
    read: z.boolean().optional(),

    count: z.number().default(1),
  })
  .transform((data) => ({
    ...data,
    read: data.read ?? data.readStatus ?? false,
  }));

export type Notification = z.infer<typeof NotificationSchema>;

/* ---------------- API RESPONSE ---------------- */

export const GetNotificationsResponseSchema = z.object({
  statusCode: z.number(),
  success: z.boolean(),
  message: z.string(),
  data: z.array(NotificationSchema),
});

export type GetNotificationsResponse = z.infer<
  typeof GetNotificationsResponseSchema
>;

/* ---------------- WS EVENT ---------------- */

export const NotificationEventSchema = z.object({
  type: z.literal("notification"),
  notification: NotificationSchema,
});

export type NotificationEvent = z.infer<typeof NotificationEventSchema>;