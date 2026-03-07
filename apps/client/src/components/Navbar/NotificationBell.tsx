"use client";

import { useEffect, useRef, useState } from "react";

interface Notification {
  message: string;
  reference_id?: string;
  createdAt?: string;
}

interface NotificationBellProps {
  employeeId: string;
}

export default function NotificationBell({ employeeId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

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

  return (
    <div className="relative">

      {/* Bell Icon */}
      <button
        onClick={() => setOpen(!open)}
        className="relative cursor-pointer"
      >
        🔔

        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-2">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-lg border z-50">

          <div className="p-3 border-b font-semibold text-sm">
            Notifications
          </div>

          <div className="max-h-80 overflow-y-auto">

            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                Nothing new 🎉
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={i}
                  className="p-3 text-sm border-b hover:bg-gray-50 cursor-pointer"
                >
                  <p>{n.message}</p>

                  {n.createdAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
              ))
            )}

          </div>
        </div>
      )}

    </div>
  );
}