"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateEmployeeInput,
  createEmployeeSchema,
} from "@/schemas/admin.schema";
import { createEmployee } from "@/actions/employeeAction";
import { getAllProjects } from "@/actions/projectAction";
import { getRoles } from "@/actions/rolesAction";

import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Check, UserPlus, X } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export function AddEmployeeDrawer({
  onEmployeeCreated,
}: {
  onEmployeeCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<{ role_id: string; role_name: string }[]>([]);
  const [projects, setProjects] = useState<{ project_id: string; project_name: string }[]>([]);

  const form = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      employee_name: "",
      employee_email: "",
      employee_contact_number: "",
      roleId: [],
      projectId: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, projectsRes] = await Promise.all([
          getRoles(),
          getAllProjects(),
        ]);
        setRoles(rolesRes);
        setProjects(projectsRes);
      } catch (err) {
        toast.error("Failed to load roles or projects");
      }
    };
    if (open) fetchData();
  }, [open]);


  const onSubmit = async (data: CreateEmployeeInput) => {
    try {
      const res = await createEmployee(data);
      if (res.success) {
        toast.success("Employee created successfully");
        form.reset();
        setOpen(false);
        onEmployeeCreated();
      } else {
        toast.error(res.message || "Failed to create employee");
      }
    } catch (err) {
      toast.error("Unexpected error while creating employee");
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        form.reset();
      }
    }}>
      <SheetTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Employee
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[500px] sm:w-[540px] p-0 z-[100]">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Add New Employee
              </SheetTitle>
              <SheetDescription className="mt-1">
                Create a new employee account and assign roles
              </SheetDescription>
            </motion.div>
          </SheetHeader>

          <motion.div 
            className="flex-1 overflow-y-auto p-6 space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Employee Name */}
            <div className="space-y-2">
              <Label htmlFor="user_name">Full Name</Label>
              <Input
                id="user_name"
                {...form.register("employee_name")}
                placeholder="Enter full name"
                className="h-10"
              />
              {form.formState.errors.employee_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.employee_name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...form.register("employee_email")}
                placeholder="Enter email address"
                className="h-10"
              />
              {form.formState.errors.employee_email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.employee_email.message}
                </p>
              )}
            </div>

            {/* Contact No */}
            <div className="space-y-2">
              <Label htmlFor="contact_no">Contact Number</Label>
              <Input
                id="contact_no"
                {...form.register("employee_contact_number")}
                placeholder="Enter contact number"
                className="h-10"
              />
              {form.formState.errors.employee_contact_number && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.employee_contact_number.message}
                </p>
              )}
            </div>

            {/* Role Dropdown */}
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
              {form.formState.errors.roleId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.roleId.message}
                </p>
              )}
            </div>

            {/* Project Dropdown */}
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                onValueChange={(value) => form.setValue("projectId", value)}
                value={form.watch("projectId")}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.projectId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.projectId.message}
                </p>
              )}
            </div>
          </motion.div>

          <div className="p-6 pt-4 border-t bg-muted/20">
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full gap-2 h-10">
              <UserPlus className="w-4 h-4" />
              Create Employee
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
