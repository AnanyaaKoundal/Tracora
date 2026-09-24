let URL = "http://localhost:5000";

export const markNotificationAsReadService = async (notificationId: string) => {
  const res = await fetch(`${URL}/notification/markAsRead`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notificationId }),
  });

  if (res.status === 403) {
    return { error: "Forbidden", status: 403, success: false };
  }

  if (!res.ok) {
    throw new Error("Failed to mark notification as read");
  }

  return res.json();
};

export const getNotificationsService = async() => {
  const res = await fetch(`${URL}/notification/getNotifications`, {
    method: "GET",
    credentials: "include",
  });

  if (res.status === 403) {
    return { error: "Forbidden", status: 403, success: false };
  }

  if (!res.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return res.json();
}