"use client";

import { useState } from "react";
import { Bug } from "@/schemas/bug.schema";
import { Employee } from "@/schemas/admin.schema";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import BugActivitySection from "./CommentSection";

interface Props {
  bug: Bug;
  setBug: React.Dispatch<React.SetStateAction<Bug | null>>;
  activities: any[];
  setActivities: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function BugInfoLeftPanel({ bug, setBug, activities, setActivities }: Props) {
  const [newComment, setNewComment] = useState("");

  function handleAddComment() {
    if (!newComment.trim()) return;
    setActivities((prev) => [
      {
        id: Date.now().toString(),
        type: "comment",
        message: newComment.trim(),
        createdBy: "currentUser",
        createdAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    setNewComment("");
  }

  return (
    <div className="space-y-4">
      {/* Bug Name */}
      <div>
        <input
          type="text"
          value={bug.bug_name}
          onChange={(e) => setBug((prev) => (prev ? { ...prev, bug_name: e.target.value } : prev))}
          className="text-2xl font-bold border-b focus:outline-none focus:border-black w-full"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          className="border rounded p-2 w-full h-80"
          value={bug.bug_description}
          onChange={(e) => setBug((prev) => (prev ? { ...prev, bug_description: e.target.value } : prev))}
        />
      </div>

      {/* Activity & Comments */}
      <BugActivitySection
  bugId={bug.bug_id}
  activities={activities}
  setActivities={setActivities}
/>

    </div>
  );
}
