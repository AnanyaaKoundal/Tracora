"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type Notification,
} from "@/schemas/notification.schema";
import {
  markNotificationAsRead,
  getNotifications,
} from "@/actions/notificationAction";

import useNotificationSocket from "@/services/websockets/useNotifications";

interface NotificationBellProps {
  employeeId: string;
}

export default function NotificationBell({ employeeId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  // -------------------------------
  // WEBSOCKET HOOK (REFACTORED)
  // -------------------------------

  useNotificationSocket({
    employeeId,
    setNotifications,
  });

  // -------------------------------
  // TRUNCATE MESSAGE
  // -------------------------------

  function truncate(text: string, max = 30) {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max) + "...";
  }

  // -------------------------------
  // GROUP NOTIFICATIONS
  // -------------------------------

  function groupNotifications(list: Notification[]): Notification[] {
    const map = new Map<string, Notification>();

    for (const n of list) {
      const key = n.reference_id || n._id!;

      if (!map.has(key)) {
        map.set(key, {
          ...n,
          count: n.read ? 0 : 1,
        });
        continue;
      }

      const existing = map.get(key)!;

      map.set(key, {
        ...existing,
        message: n.message,
        sender_name: n.sender_name,
        createdAt: n.createdAt,
        read: existing.read && n.read,
        count: existing.count + (n.read ? 0 : 1),
      });
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
    );
  }

  // -------------------------------
  // FETCH EXISTING NOTIFICATIONS
  // -------------------------------

  async function fetchNotifications() {
    try {
      const res = await getNotifications();

      if (!res?.success) return;

      setNotifications(groupNotifications(res.notifications || []));
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }

  useEffect(() => {
    if (!employeeId) return;
    fetchNotifications();
  }, [employeeId]);

  // -------------------------------
  // CLOSE ON OUTSIDE CLICK
  // -------------------------------

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // -------------------------------
  // MARK SINGLE AS READ
  // -------------------------------

  async function markAsRead(id?: string) {
    if (!id) return;

    try {
      const res = await markNotificationAsRead(id);
      if (!res?.success) return;

      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? {
                ...n,
                read: true,
                count: 0,
              }
            : n
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  }

  // -------------------------------
  // MARK ALL AS READ
  // -------------------------------

  async function markAllAsRead() {
    try {
      const unread = notifications.filter((n) => !n.read && n._id);

      await Promise.all(unread.map((n) => markNotificationAsRead(n._id!)));

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          count: 0,
        }))
      );
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  }

  // -------------------------------
  // OPEN BUG PAGE
  // -------------------------------

  async function openBug(notification: Notification) {
    if (!notification.reference_id) return;

    if (!notification.read && notification._id) {
      await markAsRead(notification._id);
    }

    router.push(`/bugs/${notification.reference_id}`);
    setOpen(false);
  }

  // -------------------------------
  // UNREAD COUNT
  // -------------------------------

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative cursor-pointer text-xl"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-[1px]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[420px] bg-white shadow-xl rounded-xl border z-50">
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notifications</h3>

            {notifications.some((n) => !n.read) && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[75vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Nothing new 🎉
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => openBug(n)}
                  className={`p-4 border-b hover:bg-gray-50 transition cursor-pointer ${
                    !n.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 font-medium">
                        New comment on {n.reference_id}
                      </span>

                      {!n.read && n.count > 0 && (
                        <span className="bg-red-500 text-white text-[11px] px-2 py-[2px] rounded-full">
                          {n.count}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-800">
                        {n.sender_name || "User"}:
                      </span>{" "}
                      {truncate(n.message)}
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-400">
                      <span>
                        {n.createdAt &&
                          new Date(n.createdAt).toLocaleString()}
                      </span>

                      {!n.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n._id);
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}