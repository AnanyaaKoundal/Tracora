"use client";

import { useEffect, useRef } from "react";
import websocketService from "@/services/websockets/websocketService";
import {
  NotificationEventSchema,
  type Notification,
} from "@/schemas/notification.schema";

interface Props {
  employeeId: string;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

// Helper to group notifications
function groupNotifications(list: Notification[]): Notification[] {
  const map = new Map<string, Notification>();

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

export default function useNotificationSocket({
  employeeId,
  setNotifications,
}: Props) {
  const handlerRef = useRef<any>(null);

  handlerRef.current = (data: any) => {
    if (data.type !== "notification") return;

    const parsed = NotificationEventSchema.safeParse(data);

    if (!parsed.success) {
      console.error("Invalid WS notification payload", parsed.error);
      return;
    }

    const incoming = parsed.data.notification;

    setNotifications((prev) => {
      // Add the new notification to the list
      const withNew = [{ ...incoming, count: 1, read: false }, ...prev];
      
      // Group and return - this ensures latest message is kept
      return groupNotifications(withNew);
    });
  };

  useEffect(() => {
    if (!employeeId) return;

    websocketService.connect();

    websocketService.send({
      type: "subscribe_user",
      employeeId,
    });

    const listener = (data: any) => handlerRef.current(data);

    websocketService.subscribe("notification", listener);

    return () => {
      websocketService.unsubscribe("notification", listener);
    };
  }, [employeeId]);
}
