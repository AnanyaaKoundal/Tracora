"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { postComment, fetchComments } from "@/actions/commentAction";
import { fetchRole } from "@/actions/employeeAction";
import { toast } from "sonner";
import { useBugComments } from "@/services/websockets/useBugComments";
import { MessageSquare, Send, User } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  bugId: string;
  activities: any[];
  setActivities: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function BugActivitySection({
  bugId,
  activities,
  setActivities,
}: Props) {
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [employee_id, setEmployeeId] = useState("");

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

  useBugComments({
    bugId,
    employeeId: employee_id,
    setActivities,
  });

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
      }
    } catch (err) {
      toast.error("Error posting comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Activity & Comments
      </h3>

      {/* Comment Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !posting) {
              e.preventDefault();
              handleAddComment();
            }
          }}
          className="flex-1"
        />
        <Button disabled={posting || !newComment.trim()} onClick={handleAddComment} className="gap-2">
          <Send className="w-4 h-4" />
          Post
        </Button>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.map((act, index) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border rounded-lg p-4 bg-muted/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{act.createdBy}</span>
                  <span className="text-xs text-muted-foreground">{act.createdAt}</span>
                </div>
                <p className="text-sm break-words whitespace-pre-wrap">{act.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No comments yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
