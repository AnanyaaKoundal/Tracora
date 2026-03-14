"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateProjectInput,
  createProjectSchema,
} from "@/schemas/project.schema";
import { createProject } from "@/actions/projectAction";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { FolderPlus, Calendar } from "lucide-react";

export function AddProjectDrawer({
  onProjectCreated,
}: {
  onProjectCreated: () => void;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      project_name: "",
      project_description: "",
      project_start_date: "",
      project_end_date: "",
      project_status: "Active",
    },
  });

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      const res = await createProject(data);
      if (res.success) {
        toast.success("Project created successfully");
        form.reset();
        setOpen(false);
        onProjectCreated();
      } else {
        toast.error(res.message || "Failed to create project");
      }
    } catch (err) {
      toast.error("Unexpected error while creating project");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          form.reset();
        }
      }}
    >
      <SheetTrigger asChild>
        <Button className="gap-2">
          <FolderPlus className="w-4 h-4" />
          Add Project
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[500px] sm:w-[540px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-primary" />
                Add New Project
              </SheetTitle>
              <SheetDescription className="mt-1">
                Create a new project to track bugs and tasks
              </SheetDescription>
            </motion.div>
          </SheetHeader>

          <motion.div 
            className="flex-1 overflow-y-auto p-6 space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="project_name">Project Name</Label>
              <Input
                id="project_name"
                {...form.register("project_name")}
                placeholder="Enter project name"
                className="h-10"
              />
              {form.formState.errors.project_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.project_name.message}
                </p>
              )}
            </div>

            {/* Project Description */}
            <div className="space-y-2">
              <Label htmlFor="project_description">Description</Label>
              <Textarea
                id="project_description"
                {...form.register("project_description")}
                placeholder="Describe the project"
                className="min-h-[100px] resize-none"
              />
              {form.formState.errors.project_description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.project_description.message}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_start_date">Start Date</Label>
                <div className="relative">
                  <Input
                    id="project_start_date"
                    type="date"
                    {...form.register("project_start_date")}
                    className="h-10 pl-10"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                {form.formState.errors.project_start_date && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.project_start_date.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_end_date">End Date</Label>
                <div className="relative">
                  <Input
                    id="project_end_date"
                    type="date"
                    {...form.register("project_end_date")}
                    className="h-10 pl-10"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                {form.formState.errors.project_end_date && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.project_end_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-2">
              <Label>Project Status</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue("project_status", value as CreateProjectInput["project_status"])
                }
                value={form.watch("project_status")}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.project_status && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.project_status.message}
                </p>
              )}
            </div>
          </motion.div>

          <div className="p-6 pt-4 border-t bg-muted/20">
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full gap-2 h-10">
              <FolderPlus className="w-4 h-4" />
              Create Project
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
