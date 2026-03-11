// /hooks/useBugComments.ts

"use client";

import { useEffect } from "react";
import websocketService from "@/services/websockets/websocketService";

interface Props {
  bugId: string;
  employeeId: string;
  setActivities: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useBugComments({ bugId, employeeId, setActivities }: Props) {
  useEffect(() => {
    if (!bugId) return;

    websocketService.connect();

    websocketService.send({
      type: "subscribe_bug",
      bugId,
    });

    const handler = (data: any) => {
      if (data.type !== "new_comment") return;

      if (data.bugId !== bugId) return;

      const comment = data.comment;

      setActivities((prev) => {
        if (prev.some((c) => c.id === comment._id)) return prev;

        const newActivity = {
          id: comment._id,
          type: "comment",
          message: comment.message,
          createdBy: comment.senderId?.employee_name || "User",
          createdAt: new Date(comment.createdAt).toLocaleString(),
        };

        return [newActivity, ...prev];
      });

      websocketService.send({
        type: "ack_notification",
        comment_id: comment._id,
        employee_id: employeeId,
      });
    };

    websocketService.subscribe("new_comment", handler);

    return () => {
      websocketService.unsubscribe("new_comment", handler);

      websocketService.send({
        type: "unsubscribe_bug",
        bugId,
      });
    };
  }, [bugId, employeeId, setActivities]);
}