"use client";

import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { projectSchema, type Project } from "@/schemas/project.schema";
import { motion } from "framer-motion";
import { FolderEdit, Calendar, Save } from "lucide-react";

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
  const { register, handleSubmit, reset, watch, setValue } = useForm<Project>({
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

  useEffect(() => {
    if (!open) return;
    if (project) {
      reset({
        ...project,
        project_start_date: project.project_start_date
          ? new Date(project.project_start_date).toISOString().split("T")[0]
          : "",
        project_end_date: project.project_end_date
          ? new Date(project.project_end_date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [open, project, reset]);

  const onSubmit = async (data: Project) => {
    if (!project) return;
    const res = await onSave(project.project_id, data);
    if (res.success) {
      toast.success("Project updated successfully");
      onOpenChange(false);
    } else {
      toast.error(res.message || "Failed to update project");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] sm:w-[540px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <FolderEdit className="w-5 h-5 text-primary" />
                Edit Project
              </SheetTitle>
              <SheetDescription className="mt-1">
                Update project details and settings
              </SheetDescription>
            </motion.div>
          </SheetHeader>

          <motion.div 
            className="flex-1 overflow-y-auto p-6 space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* ID (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="project_id">Project ID</Label>
              <Input id="project_id" {...register("project_id")} disabled className="bg-muted h-10" />
            </div>

            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="project_name">Project Name</Label>
              <Input id="project_name" {...register("project_name")} className="h-10" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="project_description">Description</Label>
              <Textarea id="project_description" {...register("project_description")} className="min-h-[100px] resize-none" />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_start_date">Start Date</Label>
                <div className="relative">
                  <Input
                    id="project_start_date"
                    type="date"
                    {...register("project_start_date")}
                    className="h-10 pl-10"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_end_date">End Date</Label>
                <div className="relative">
                  <Input
                    id="project_end_date"
                    type="date"
                    {...register("project_end_date")}
                    className="h-10 pl-10"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="project_status">Status</Label>
              <Select
                value={watch("project_status")}
                onValueChange={(value) => setValue("project_status", value as Project["project_status"])}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <div className="p-6 pt-4 border-t bg-muted/20">
            <Button type="submit" onClick={handleSubmit(onSubmit)} className="w-full gap-2 h-10">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
