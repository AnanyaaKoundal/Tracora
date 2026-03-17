"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
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
  // WEBSOCKET HOOK
  // -------------------------------

  useNotificationSocket({
    employeeId,
    setNotifications,
  });

  // -------------------------------
  // SORT: Unread first (by date), then read (by date)
  // -------------------------------

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      // First, separate unread and read
      const aUnread = !a.read;
      const bUnread = !b.read;

      // If one is unread and other is read, unread goes first
      if (aUnread && !bUnread) return -1;
      if (!aUnread && bUnread) return 1;

      // Both same read status - sort by date (newest first)
      const dateA = new Date(a.createdAt || "").getTime();
      const dateB = new Date(b.createdAt || "").getTime();
      return dateB - dateA;
    });
  }, [notifications]);

  // -------------------------------
  // GET NOTIFICATION TITLE
  // -------------------------------

  function getNotificationTitle(n: Notification): string {
    const title = n.reference_name || n.reference_id || "Bug";
    
    switch (n.type) {
      case "COMMENT":
        return `New comment on ${title}`;
      case "BUG_CREATED":
        return `New bug created: ${title}`;
      case "STATUS_CHANGED":
        return `Bug status changed: ${title}`;
      case "ASSIGNED":
        return `You were assigned to: ${title}`;
      default:
        return `Notification on ${title}`;
    }
  }

  // -------------------------------
  // TRUNCATE MESSAGE
  // -------------------------------

  function truncate(text: string, max = 40) {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max) + "...";
  }

  // -------------------------------
  // GROUP NOTIFICATIONS
  // -------------------------------

  function groupNotifications(list: Notification[]): Notification[] {
    const map = new Map<string, Notification>();

    // Sort by createdAt descending first to ensure latest is processed last
    const sorted = [...list].sort(
      (a, b) =>
        new Date(b.createdAt || "").getTime() -
        new Date(a.createdAt || "").getTime()
    );

    for (const n of sorted) {
      const key = n.reference_id || n._id!;

      if (!map.has(key)) {
        map.set(key, {
          ...n,
          count: n.read ? 0 : 1,
        });
        continue;
      }

      const existing = map.get(key)!;

      // Keep the latest message (since sorted by date descending)
      map.set(key, {
        ...existing,
        message: n.message,
        sender_name: n.sender_name,
        createdAt: n.createdAt,
        read: existing.read && n.read,
        count: existing.count + (n.read ? 0 : 1),
      });
    }

    return Array.from(map.values());
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

      // Update the notification - set read to true, count to 0
      // The useMemo will automatically re-sort it
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
        className="relative cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground" />

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

            {sortedNotifications.some((n) => !n.read) && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[75vh] overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Nothing new 🎉
              </div>
            ) : (
              sortedNotifications.map((n) => (
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
                        {getNotificationTitle(n)}
                      </span>

                      {!n.read && n.count > 1 && (
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
