"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateBugInput, createBugSchema, BugPriority } from "@/schemas/bug.schema";
import { createBug } from "@/actions/bugAction";
import { fetchEmpForDashboard } from "@/services/adminService";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Employee = {
  employee_id: string;
  employee_name: string;
};

export function AddBugDrawer({ onBugCreated }: { onBugCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const form = useForm<CreateBugInput>({
    defaultValues: {
      bug_name: "",
      bug_description: "",
      bug_status: "Open",
      assigned_to: "",
      comments: [],
      bug_priority: BugPriority.Medium, // numeric value
    },
  });

  // Fetch employees for dropdown
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetchEmpForDashboard();
        if (res.success) setEmployees(res.data);
        else toast.error(res.message || "Failed to load employees");
      } catch (err) {
        console.error(err);
        toast.error("Error fetching employees");
      }
    }
    loadEmployees();
  }, []);

  const onSubmit = async (data: CreateBugInput) => {
    try {
      const res = await createBug(data);
      if (res.success) {
        toast.success("Bug created successfully 🐞");
        form.reset();
        setOpen(false);
        onBugCreated();
      } else {
        toast.error(res.message || "Failed to create bug ❌");
      }
    } catch (err) {
      toast.error("Unexpected error while creating bug ❌");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) form.reset();
      }}
    >
      <SheetTrigger asChild>
        <Button>+ Report Bug</Button>
      </SheetTrigger>

      <SheetContent side="right" className="min-w-1/3 sm:w-1/3 p-5">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Report a Bug</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* Bug Name */}
          <div className="space-y-2">
            <Label htmlFor="bug_name">Bug Title</Label>
            <Input
              id="bug_name"
              {...form.register("bug_name")}
              placeholder="Enter bug title"
            />
            {form.formState.errors.bug_name && (
              <p className="text-red-500 text-sm">{form.formState.errors.bug_name.message}</p>
            )}
          </div>

          {/* Bug Description */}
          <div className="space-y-2">
            <Label htmlFor="bug_description">Description</Label>
            <Textarea
              id="bug_description"
              {...form.register("bug_description")}
              placeholder="Describe the bug in detail"
            />
            {form.formState.errors.bug_description && (
              <p className="text-red-500 text-sm">{form.formState.errors.bug_description.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              onValueChange={(value) =>
                form.setValue("bug_status", value as CreateBugInput["bug_status"])
              }
              value={form.watch("bug_status")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              onValueChange={(value) =>
                form.setValue("bug_priority", parseInt(value) as CreateBugInput["bug_priority"])
              }              
              value={form.watch("bug_priority").toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BugPriority.Critical.toString()}>Critical</SelectItem>
                <SelectItem value={BugPriority.High.toString()}>High</SelectItem>
                <SelectItem value={BugPriority.Medium.toString()}>Medium</SelectItem>
                <SelectItem value={BugPriority.Low.toString()}>Low</SelectItem>
                <SelectItem value={BugPriority.Trivial.toString()}>Trivial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select
              onValueChange={(value) => form.setValue("assigned_to", value)}
              value={form.watch("assigned_to")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.employee_id} value={e.employee_id}>
                    {e.employee_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Report Bug
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
