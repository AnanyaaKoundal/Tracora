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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";

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
  const form = useForm<Employee>({
    defaultValues: {
      employee_id: "",
      employee_name: "",
      employee_email: "",
      employee_contact_number: "",
      roleId: [], // <-- now array of ids
      projectId: null, // <-- single id or null
    },
  });

  useEffect(() => {
    if (!open) return;
    if (employee) {
      form.reset({
        ...employee,
        roleId: employee.roleId || [],
        projectId: employee.projectId || null,
      });
    }
  }, [open, employee, form]);

  const onSubmit = async (data: Employee) => {
    if (!employee) return;
    const res = await onSave(employee.employee_id, data);
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* ID (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="_id">Employee ID</Label>
            <Input id="_id" {...form.register("employee_id")} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_name">Name</Label>
            <Input id="user_name" {...form.register("employee_name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("employee_email")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_no">Contact Number</Label>
            <Input id="contact_no" {...form.register("employee_contact_number")} />
          </div>

          {/* Roles (multi-select) */}
          <div className="space-y-2">
            <Label>Roles</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {form.watch("roleId")?.length > 0
                    ? `${form.watch("roleId").length} role(s) selected`
                    : "Select roles"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandGroup>
                    {roles.map((role) => {
                      const checked = form.watch("roleId")?.includes(role.role_id);
                      return (
                        <CommandItem
                          key={role.role_id}
                          onSelect={() => {
                            const currentRoles = form.getValues("roleId") || [];
                            if (checked) {
                              form.setValue(
                                "roleId",
                                currentRoles.filter((r: string) => r !== role.role_id)
                              );
                            } else {
                              form.setValue("roleId", [...currentRoles, role.role_id]);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={checked} />
                            <span>{role.role_name}</span>
                          </div>
                          {checked && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.roleId && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.roleId.message}
              </p>
            )}
          </div>

          {/* Project (single-select dropdown) */}
          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <select
              id="projectId"
              {...form.register("projectId")}
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
