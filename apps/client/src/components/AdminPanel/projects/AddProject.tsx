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
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        toast.success("Project created successfully ✅");
        form.reset();
        setOpen(false); // close drawer
        onProjectCreated(); // refresh parent
      } else {
        toast.error(res.message || "Failed to create project ❌");
      }
    } catch (err) {
      toast.error("Unexpected error while creating project ❌");
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
        <Button>+ Add Project</Button>
      </SheetTrigger>
      <SheetContent side="right" className="min-w-1/3 sm:w-1/3 p-5">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Add New Project</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project_name">Project Name</Label>
            <Input
              id="project_name"
              {...form.register("project_name")}
              placeholder="Enter project name"
            />
            {form.formState.errors.project_name && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.project_name.message}
              </p>
            )}
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="project_description">Description</Label>
            <Input
              id="project_description"
              {...form.register("project_description")}
              placeholder="Enter project description"
            />
            {form.formState.errors.project_description && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.project_description.message}
              </p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="project_start_date">Start Date</Label>
            <Input
              id="project_start_date"
              type="date"
              {...form.register("project_start_date")}
            />
            {form.formState.errors.project_start_date && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.project_start_date.message}
              </p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="project_end_date">End Date</Label>
            <Input
              id="project_end_date"
              type="date"
              {...form.register("project_end_date")}
            />
            {form.formState.errors.project_end_date && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.project_end_date.message}
              </p>
            )}
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

              <SelectTrigger>
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
              <p className="text-red-500 text-sm">
                {form.formState.errors.project_status.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full">
            Save Project
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
