"use client";

import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { projectSchema, type Project } from "@/schemas/project.schema";

export function EditProjectDrawer({
  open,
  onOpenChange,
  project,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSave: (
    id: string,
    data: Project
  ) => Promise<{ success: boolean; message?: string }>;
}) {
  const { register, handleSubmit, reset } = useForm<Project>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      project_id: "",
      project_name: "",
      project_description: "",
      project_start_date: "",
      project_end_date: undefined,
      project_status: "Active",
      created_by: "",
    },
  });

  // ✅ Reset form values when project changes
  useEffect(() => {
    if (!open) return;
    if (project) reset(project);
  }, [open, project, reset]);

  const onSubmit = async (data: Project) => {
    if (!project) return;
    const res = await onSave(project.project_id, data);
    if (res.success) {
      toast.success("Project updated");
      onOpenChange(false);
    } else {
      toast.error(res.message || "Failed to update project");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="min-w-1/3 sm:w-1/3 p-5">
        <SheetHeader>
          <SheetTitle>Edit Project</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* ID (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="project_id">Project ID</Label>
            <Input id="project_id" {...register("project_id")} disabled />
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project_name">Project Name</Label>
            <Input id="project_name" {...register("project_name")} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="project_description">Description</Label>
            <Textarea id="project_description" {...register("project_description")} />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="project_start_date">Start Date</Label>
            <Input id="project_start_date" type="date" {...register("project_start_date")} />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="project_end_date">End Date</Label>
            <Input id="project_end_date" type="date" {...register("project_end_date")} />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="project_status">Status</Label>
            <select
              id="project_status"
              {...register("project_status")}
              className="border rounded p-2 w-full"
            >
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
