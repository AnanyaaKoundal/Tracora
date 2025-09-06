"use client";

import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type Employee } from "@/schemas/admin.schema";
import { toast } from "sonner";

type Role = { role_id: string; role_name: string };
type Project = { project_id: string; project_name: string };

export function EditEmployeeDrawer({
  open,
  onOpenChange,
  employee,
  roles,
  projects,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  roles: Role[];
  projects: Project[];
  onSave: (id: string, data: Employee) => Promise<{ success: boolean; message?: string }>;
}) {
  const { register, handleSubmit, reset } = useForm<Employee>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      _id: "",
      user_name: "",
      email: "",
      contact_no: "",
      roleId: { _id: "", role_name: "" },
      projectId: { _id: "", project_name: "" },
    },
  });

  // ✅ Reset form values when employee changes
  useEffect(() => {
    if (!open) return;
    if (employee) reset(employee);
  }, [open, employee, reset]);

  const onSubmit = async (data: Employee) => {
    if (!employee) return;
    const res = await onSave(employee._id, data);
    if (res.success) {
      toast.success("Employee updated");
      onOpenChange(false);
    } else {
      toast.error(res.message || "Failed to update employee");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="min-w-1/3 sm:w-1/3 p-5">
        <SheetHeader>
          <SheetTitle>Edit Employee</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* ID (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="_id">Employee ID</Label>
            <Input id="_id" {...register("_id")} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_name">Name</Label>
            <Input id="user_name" {...register("user_name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_no">Contact Number</Label>
            <Input id="contact_no" {...register("contact_no")} />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="roleId._id">Role</Label>
            <select id="roleId._id" {...register("roleId._id")} className="border rounded p-2 w-full">
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.role_id} value={r.role_id}>
                  {r.role_name}
                </option>
              ))}
            </select>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="projectId._id">Project</Label>
            <select
              id="projectId._id"
              {...register("projectId._id")}
              className="border rounded p-2 w-full"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name}
                </option>
              ))}
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
