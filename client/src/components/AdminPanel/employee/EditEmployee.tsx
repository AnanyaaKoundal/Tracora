"use client";

import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type Employee } from "@/schemas/admin.schema";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, User, Save } from "lucide-react";
import { motion } from "framer-motion";

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
      roleId: [],
      projectId: null,
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
      toast.success("Employee updated successfully");
      onOpenChange(false);
    } else {
      toast.error(res.message || "Failed to update employee");
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
                <User className="w-5 h-5 text-primary" />
                Edit Employee
              </SheetTitle>
              <SheetDescription className="mt-1">
                Update employee information and assignments
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
              <Label htmlFor="_id">Employee ID</Label>
              <Input id="_id" {...form.register("employee_id")} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_name">Full Name</Label>
              <Input id="user_name" {...form.register("employee_name")} className="h-10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" {...form.register("employee_email")} className="h-10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_no">Contact Number</Label>
              <Input id="contact_no" {...form.register("employee_contact_number")} className="h-10" />
            </div>

            {/* Roles (multi-select) */}
            <div className="space-y-2">
              <Label>Roles</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between h-10"
                  >
                    {form.watch("roleId")?.length > 0
                      ? `${form.watch("roleId").length} role(s) selected`
                      : "Select roles"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-2">
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
                            className="flex items-center gap-2"
                          >
                            <Checkbox checked={checked} className="mr-2" />
                            <span>{role.role_name}</span>
                            {checked && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Project (single-select dropdown) */}
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select
                value={form.watch("projectId") || "none"}
                onValueChange={(value) => form.setValue("projectId", value === "none" ? null : value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.project_id} value={p.project_id}>
                      {p.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <div className="p-6 pt-4 border-t bg-muted/20">
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full gap-2 h-10">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
