"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { postComment, fetchComments } from "@/actions/commentAction";
import { fetchRole } from "@/actions/employeeAction";
import { toast } from "sonner";
import { useBugComments } from "@/services/websockets/useBugComments";

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
  const [employee_id, setEmployeeId] = useState("");

  // -------------------------------
  // FETCH COMMENTS ON MOUNT
  // -------------------------------
  useEffect(() => {
    async function loadComments() {
      const res = await fetchComments(bugId);
      const role_data = await fetchRole();

      if (!res.success || !role_data.success) {
        toast.error("Failed to load comments");
        return;
      }

      setEmployeeId(role_data.employee_id);

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
  // REALTIME COMMENTS HOOK
  // -------------------------------
  useBugComments({
    bugId,
    employeeId: employee_id,
    setActivities,
  });

  // -------------------------------
  // HANDLE ADD COMMENT
  // -------------------------------
  async function handleAddComment() {
    if (!newComment.trim()) return;

    const message = newComment.trim();
    setNewComment("");

    try {
      setPosting(true);

      const res = await postComment({
        bug_id: bugId,
        message,
      });

      if (!res.success) {
        toast.error("Failed to post comment");
      } else {
        toast.success("Comment added!");
        // WebSocket hook will update activity
      }
    } catch (err) {
      toast.error("Error posting comment");
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
          onKeyDown={(e) => {
            if (e.key === "Enter" && !posting) {
              e.preventDefault();
              handleAddComment();
            }
          }}
        />

        <Button disabled={posting} onClick={handleAddComment}>
          {posting ? "Posting..." : "Post"}
        </Button>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.map((act) => (
          <div
            key={act.id}
            className="border w-[1162px] rounded p-3 text-sm bg-gray-50"
          >
            <p className="break-words whitespace-pre-wrap">{act.message}</p>
            <span className="text-gray-500 text-xs">
              by {act.createdBy} on {act.createdAt}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}