"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoleSchema, CreateRoleInput } from "@/schemas/admin.schema";
import { createRole } from "@/actions/rolesAction"; 
import { toast } from "sonner"; // ✅ replacement for old shadcn toast
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
import { useState } from "react";

export function AddRoleDrawer({ onRoleCreated }: { onRoleCreated: () => void }) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { role_name: "" },
  });

  const onSubmit = async (data: CreateRoleInput) => {
    try {
      const res = await createRole(data);
      if (res.success) {
        toast.success("Role created successfully ✅");
        form.reset();
        setOpen(false); // ✅ close drawer
        onRoleCreated(); // ✅ tell parent to refresh
      } else {
        toast.error(res.message || "Failed to create role ❌");
      }
    } catch (err) {
      toast.error("Unexpected error while creating role ❌");
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
        <Button>+ Add Role</Button>
      </SheetTrigger>
      <SheetContent side="right" className="min-w-1/3 sm:w-1/3 p-5">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Add New Role</SheetTitle>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="role">Role Name</Label>
            <Input
              id="role"
              {...form.register("role_name")}
              placeholder="Enter role name"
            />
            {form.formState.errors.role_name && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.role_name.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Save Role
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
