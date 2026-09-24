import { GetNotificationsResponseSchema } from "@/schemas/notification.schema";
import { markNotificationAsReadService } from "@/services/notificationService";
import { getNotificationsService } from "@/services/notificationService";

export interface MarkNotificationResponse {
  success: boolean;
  notification?: any;
  message?: string;
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<MarkNotificationResponse> {
  try {
    console.log("Actions: ", notificationId)
    const data = await markNotificationAsReadService(notificationId);

    if (data.status === 403) {
      window.location.href = "/forbidden";
      return { success: false };
    }

    if (!data.success) {
      console.error("Failed to mark notification as read", data.error);
      return { success: false, message: data.error };
    }

    return {
      success: true,
      notification: data.data,
    };

  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to mark notification as read",
    };
  }
}

export async function getNotifications() {
  try {
    const data = await getNotificationsService();

    if (data.status === 403) {
      window.location.href = "/forbidden";
      return { success: false };
    }

    const parsed = GetNotificationsResponseSchema.safeParse(data);

    if (!parsed.success) {
      console.error("Invalid notifications response", parsed.error);
      return { success: false };
    }

    return {
      success: true,
      notifications: parsed.data.data,
    };

  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to fetch notifications",
    };
  }
}