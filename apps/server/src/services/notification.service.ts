import Notification from "@/models/notification.model";
import ApiError from "../utils/ApiError";
import Employee from "@/models/employee.model";

export const createNotification = async (notificationData: any) => {
  const { sender_id } = notificationData;

  const sender = await Employee.findOne({ employee_id: sender_id }).select("employee_name");

  const newNotification = await Notification.create({
    ...notificationData,
    sender_name: sender.employee_name,
  });

  console.log("IN NOTIFICATION SERVICE: ", newNotification);

  return newNotification;
};

export const markNotificationRead = async (id: string) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { readStatus: true },
      { new: true } // return the updated document
    );

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }
    console.log("MARKED AS READ: ", notification);
    return notification;
  } catch (error: any) {
    throw new ApiError(500, error.message || "Failed to mark notification as read");
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
