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
      const existingIndex = prev.findIndex(
        (n) => n.reference_id === incoming.reference_id
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        const existing = updated[existingIndex];

        const updatedNotification = {
          ...existing,
          message: incoming.message,
          sender_name: incoming.sender_name,
          createdAt: incoming.createdAt,
          count: (existing.count || 0) + 1,
          read: false,
        };

        updated.splice(existingIndex, 1);
        return [updatedNotification, ...updated];
      }

      return [{ ...incoming, count: 1, read: false }, ...prev];
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