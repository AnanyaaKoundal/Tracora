import Notification from "@/models/notification.model";
import ApiError from "../utils/ApiError";

/**
 * CREATE Notification
 */
export const createNotification = async (notificationData: any) => {
  const { title, reference_id } = notificationData;

  // Optional: Prevent duplicate notifications for same reference_id + title
  // const existingNotification = await Notification.findOne({ title, reference_id });
  // if (existingNotification) {
  //   throw new ApiError(400, "Notification already exists");
  // }

  const newNotification = await Notification.create({
    ...notificationData,
  });

  console.log("IN NOTIFICATION SERVICE: ", newNotification);

  return newNotification;
};

// UI Design
// bug id: title  ---                        count
// latest msg

/**
 * GET All Notifications
 */
export const getAllNotifications = async () => {
  const notifications = await Notification.find();
  return notifications;
};

/**
 * GET Notification by ID
 */
export const getNotificationById = async (notificationId: string) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

/**
 * UPDATE Notification
 */
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

/**
 * DELETE Notification
 */
export const deleteNotificationById = async (notificationId: string) => {
  const notification = await Notification.findByIdAndDelete(notificationId);

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return notification;
};

/**
 * DELETE Multiple Notifications
 */
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

/**
 * GET Notifications for a specific participant (User)
 */
export const getNotificationsForUser = async (employee_id: string) => {
  const notifications = await Notification.find({
    participants: employee_id,
  });

  return notifications;
};
