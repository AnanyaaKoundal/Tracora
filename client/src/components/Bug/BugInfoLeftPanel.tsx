"use client";

import { useState } from "react";
import { Bug } from "@/schemas/bug.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import BugActivitySection from "./CommentSection";

interface Props {
  bug: Bug;
  setBug: React.Dispatch<React.SetStateAction<Bug | null>>;
  activities: any[];
  setActivities: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function BugInfoLeftPanel({ bug, setBug, activities, setActivities }: Props) {
  return (
    <div className="space-y-6">
      {/* Bug Name */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Title</Label>
        <Input
          type="text"
          value={bug.bug_name}
          onChange={(e) => setBug((prev) => (prev ? { ...prev, bug_name: e.target.value } : prev))}
          className="text-xl font-semibold bg-transparent border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Description</Label>
        <Textarea
          className="min-h-[180px] resize-none bg-muted/30"
          value={bug.bug_description}
          onChange={(e) => setBug((prev) => (prev ? { ...prev, bug_description: e.target.value } : prev))}
          placeholder="Add a description..."
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
