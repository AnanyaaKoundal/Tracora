"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateEmployeeInput,
  createEmployeeSchema,
} from "@/schemas/admin.schema";
import { createEmployee } from "@/actions/employeeAction";
import { getProjects } from "@/actions/projectAction";
import { getRoles } from "@/actions/rolesAction";

import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {Checkbox} from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddEmployeeDrawer({
  onEmployeeCreated,
}: {
  onEmployeeCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

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
          getProjects(),
        ]);
        setRoles(rolesRes);
        console.log("Roles: ", rolesRes);
        setProjects(projectsRes);
      } catch (err) {
        toast.error("Failed to load roles or projects ❌");
      }
    };
    fetchData();
  }, []);


  const onSubmit = async (data: CreateEmployeeInput) => {
    try {
      const res = await createEmployee(data);
      if (res.success) {
        toast.success("Employee created successfully ✅");
        form.reset();
        setOpen(false); // close drawer
        onEmployeeCreated(); // refresh parent
      } else {
        toast.error(res.message || "Failed to create employee ❌");
      }
    } catch (err) {
      toast.error("Unexpected error while creating employee ❌");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>+ Add Employee</Button>
      </SheetTrigger>
      <SheetContent side="right" className="min-w-1/3 sm:w-1/3 p-5">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Add New Employee</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* Employee Name */}
          <div className="space-y-2">
            <Label htmlFor="user_name">Employee Name</Label>
            <Input
              id="user_name"
              {...form.register("employee_name")}
              placeholder="Enter employee name"
            />
            {form.formState.errors.employee_name && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.employee_name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("employee_email")}
              placeholder="Enter email"
            />
            {form.formState.errors.employee_email && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.employee_email.message}
              </p>
            )}
          </div>

          {/* Contact No */}
          <div className="space-y-2">
            <Label htmlFor="contact_no">Contact No</Label>
            <Input
              id="contact_no"
              {...form.register("employee_contact_number")}
              placeholder="Enter contact number"
            />
            {form.formState.errors.employee_contact_number && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.employee_contact_number.message}
              </p>
            )}
          </div>

          {/* Role Dropdown */}

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="space-y-2">
              {roles.map((role) => {
                const checked = form.watch("roleId")?.includes(role.id);
                return (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={checked}
                      onCheckedChange={(isChecked) => {
                        const currentRoles = form.getValues("roleId") || [];
                        if (isChecked) {
                          form.setValue("roleId", [...currentRoles, role.id]);
                        } else {
                          form.setValue(
                            "roleId",
                            currentRoles.filter((r: string) => r !== role.id)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
                  </div>
                );
              })}
            </div>
            {form.formState.errors.roleId && (
              <p className="text-red-500 text-sm">
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
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.projectId && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.projectId.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full">
            Save Employee
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
