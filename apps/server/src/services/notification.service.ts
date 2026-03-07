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

export const getAllNotifications = async () => {
  const notifications = await Notification.find();
  return notifications;
};

export const getNotificationById = async (notificationId: string) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

export const editNotification = async (
  notificationId: string,
  updateData: any
) => {
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { ...updateData, updated_at: Date.now() },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

export const deleteNotificationById = async (notificationId: string) => {
  const notification = await Notification.findByIdAndDelete(notificationId);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

export const deleteNotificationsByIds = async (notificationIds: string[]) => {
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    throw new ApiError(400, "No notification IDs provided");
  }

  const result = await Notification.deleteMany({
    _id: { $in: notificationIds },
  });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "No notifications deleted");
  }

  return { deletedCount: result.deletedCount };
};

export const getNotificationsForUser = async (employee_id: string) => {
  const notifications = await Notification.find({
    participants: employee_id,
  });

  return notifications;
};
