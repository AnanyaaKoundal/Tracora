"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { postComment, fetchComments } from "@/actions/commentAction";
import { toast } from "sonner";

interface Props {
  bugId: string;
  activities: any[];
  setActivities: React.Dispatch<React.SetStateAction<any[]>>;
  assigneeId?: string | null;
}

export default function BugActivitySection({
  bugId,
  activities,
  setActivities,
}: Props) {
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  // -------------------------------
  // WEBSOCKET REF
  // -------------------------------
  const wsRef = useRef<WebSocket | null>(null);
  const tempIdsRef = useRef<Set<string>>(new Set()); // Track optimistic IDs

  // -------------------------------
  // FETCH COMMENTS ON MOUNT
  // -------------------------------
  useEffect(() => {
    async function loadComments() {
      const res = await fetchComments(bugId);

      if (!res.success) {
        toast.error("Failed to load comments");
        return;
      }

      const formatted = res.comments.map((c: any) => ({
        id: c._id,
        type: "comment",
        message: c.message,
        createdBy: c.senderId?.employee_name || "User",
        createdAt: new Date(c.createdAt).toLocaleString(),
      }));

      setActivities((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const unique = formatted.filter((item: any) => !existingIds.has(item.id));
        return [...unique, ...prev];
      });
    }

    loadComments();
  }, [bugId, setActivities]);

  // -------------------------------
  // WEBSOCKET CONNECTION
  // -------------------------------
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WS connected");
      ws.send(JSON.stringify({ type: "subscribe_bug", bugId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "new_comment" && data.bugId === bugId) {
        setActivities((prev) => {
          // Deduplicate by tempId or real _id
          const exists = prev.some(
            (c) => c.id === data.comment._id || tempIdsRef.current.has(c.id)
          );
          if (exists) return prev;

          return [
            {
              id: data.comment._id,
              type: "comment",
              message: data.comment.message,
              createdBy: data.comment.senderId?.employee_name || "User",
              createdAt: new Date(data.comment.createdAt).toLocaleString(),
            },
            ...prev,
          ];
        });

        // Remove tempId if the WS comment matches the message
        tempIdsRef.current.forEach((id) => {
          if (
            activities.find((c) => c.id === id)?.message ===
            data.comment.message
          ) {
            tempIdsRef.current.delete(id);
          }
        });
      }
    };

    ws.onerror = (err) => console.error("❌ WS error:", err);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "unsubscribe_bug", bugId }));
      }
      ws.close();
    };
  }, [bugId, activities, setActivities]);

  // -------------------------------
  // HANDLE ADD COMMENT
  // -------------------------------
  async function handleAddComment() {
    if (!newComment.trim()) return;

    const message = newComment.trim();
    const tempId = Date.now().toString();

    // -------------------------------
    // Optimistic update
    // -------------------------------
    tempIdsRef.current.add(tempId);
    setActivities((prev) => [
      {
        id: tempId,
        type: "comment",
        message,
        createdBy: "You",
        createdAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    setNewComment("");

    try {
      setPosting(true);
      const res = await postComment({ bug_id: bugId, message });

      if (!res.success) {
        toast.error("Failed to post comment");
        // Remove optimistic comment on failure
        setActivities((prev) => prev.filter((c) => c.id !== tempId));
        tempIdsRef.current.delete(tempId);
      } else {
        toast.success("Comment added!");
        // WS will deliver the real comment; tempId will be removed there
      }
    } catch (err) {
      toast.error("Error posting comment");
      setActivities((prev) => prev.filter((c) => c.id !== tempId));
      tempIdsRef.current.delete(tempId);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Activity & Comments</h2>

      {/* Comment Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Write a comment..."
          className="flex-1 border rounded p-2"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button disabled={posting} onClick={handleAddComment}>
          {posting ? "Posting..." : "Post"}
        </Button>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.map((act) => (
          <div key={act.id} className="border rounded p-3 text-sm bg-gray-50">
            <p>{act.message}</p>
            <span className="text-gray-500 text-xs">
              by {act.createdBy} on {act.createdAt}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}