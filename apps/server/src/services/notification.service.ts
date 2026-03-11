import Notification from "@/models/notification.model";
import ApiError from "../utils/ApiError";
import Employee from "@/models/employee.model";

export const createNotification = async (notificationData: any) => {
  const { sender_id, sender_name } = notificationData;

  let finalSenderName = sender_name;
  if (!finalSenderName && sender_id) {
    const sender = await Employee.findOne({ employee_id: sender_id }).select("employee_name");
    finalSenderName = sender?.employee_name;
  }

  const newNotification = await Notification.create({
    ...notificationData,
    sender_name: finalSenderName,
  });

  return newNotification;
};

export const markNotificationRead = async (id: string) => {
  try {

    // 1️⃣ Find the clicked notification
    const notification = await Notification.findById(id);

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    const { reference_id, participants } = notification;

    // 2️⃣ Mark all notifications of that bug as read for that user
    await Notification.updateMany(
      {
        reference_id: reference_id,
        participants: { $in: participants },
      },
      {
        $set: { readStatus: true },
      }
    );

    console.log("Marked all notifications read for bug:", reference_id);

    return true;

  } catch (error: any) {
    throw new ApiError(
      500,
      error.message || "Failed to mark notifications as read"
    );
  }
};

export const getNotificationsForUser = async (employee_id: string) => {
  try {

    // 1️⃣ get unread count
    const unreadCount = await Notification.countDocuments({
      participants: employee_id,
      readStatus: false,
    });

    let notifications;

    // 2️⃣ if unread > 20 → return all unread
    if (unreadCount > 20) {
      notifications = await Notification.find({
        participants: employee_id,
        readStatus: false,
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    // 3️⃣ normal case
    else {
      const unreadNotifications = await Notification.find({
        participants: employee_id,
        readStatus: false,
      })
        .sort({ createdAt: -1 })
        .lean();

      const remaining = 20 - unreadNotifications.length;

      const readNotifications = await Notification.find({
        participants: employee_id,
        readStatus: true,
      })
        .sort({ createdAt: -1 })
        .limit(remaining)
        .lean();

      notifications = [...unreadNotifications, ...readNotifications];
    }

    return notifications;
  } catch (error: any) {
    throw new ApiError(
      500,
      error.message || "Failed to fetch notifications"
    );
  }
};
