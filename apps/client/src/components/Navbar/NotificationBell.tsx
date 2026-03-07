"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
  _id?: string;
  message: string;
  reference_id?: string; // bug id
  sender_name?: string;
  createdAt?: string;
  read?: boolean;
}

interface NotificationBellProps {
  employeeId: string;
}

export default function NotificationBell({ employeeId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();

  // -------------------------------
  // TRUNCATE MESSAGE
  // -------------------------------
  function truncate(text: string, max = 30) {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max) + "...";
  }

  // -------------------------------
  // WEBSOCKET CONNECTION
  // -------------------------------
  useEffect(() => {
    if (!employeeId) return;

    const ws = new WebSocket("ws://localhost:5000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🔔 Notification WS connected");
      ws.send(
        JSON.stringify({
          type: "subscribe_user",
          employeeId,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "notification") {
        console.log("🔔 Notification received:", data.notification);
        setNotifications((prev) => [data.notification, ...prev]);
      }
    };

    ws.onerror = (err) => {
      console.error("WS error:", err);
    };

    return () => {
      ws.close();
    };
    
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
  // MARK AS READ
  // -------------------------------
  async function markAsRead(id?: string) {
    if (!id) return;

    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  }

  // -------------------------------
  // OPEN BUG PAGE
  // -------------------------------
  function openBug(notification: Notification) {
    if (!notification.reference_id) return;

    router.push(`/bugs/${notification.reference_id}`);
    setOpen(false);
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div ref={containerRef} className="relative">

      {/* Bell */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative cursor-pointer text-xl"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-[1px]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-3 w-[420px] bg-white shadow-xl rounded-xl border z-50">

          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notifications</h3>
          </div>

          {/* Content */}
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
                  <div className="flex justify-between items-start gap-4">
              
                    <div className="flex flex-col text-sm flex-1">
              
                        
                        <span className="font-normal text-blue-600">
                          New comment on{" "}
                          {n.reference_id}
                        </span>
              
                      {/* Action + Bug ID */}
                      {/* {n.sender_name && ( */}
                      <span className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-800">
                        {n.sender_name || "User"} : 
                        </span>
                        {truncate(n.message)} 
                      </span>
                      {/* )} */}
              
                      {/* Time */}
                      {n.createdAt && (
                        <span className="text-xs text-gray-400 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
              
                    {/* Mark read */}
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n._id);
                        }}
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        Mark as read
                      </button>
                    )}
              
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