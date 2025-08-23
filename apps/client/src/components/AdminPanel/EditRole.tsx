"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoleSchema } from "@/schemas/admin.schema";
import { toast } from "sonner";

type RoleForm = {
  role_name: string;
};

export function EditRoleDrawer({
  open,
  onOpenChange,
  role,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleForm | null;
  onSave: (data: RoleForm) => Promise<{ success: boolean; data?: any; message?: string }>;
}) {
  const { register, handleSubmit, reset } = useForm<RoleForm>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { role_name: "" },
  });

  // prefill form whenever role changes
  useEffect(() => {
    if (role) reset(role);
  }, [role, reset]);

  const onSubmit = async (data: RoleForm) => {
    try {
      await onSave(data);
      toast.success("Role updated successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="min-w-1/3 sm:w-1/3 p-5">
        <SheetHeader>
          <SheetTitle>Edit Role</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="role_name">Role Name</Label>
            <Input id="role_name" {...register("role_name")} />
          </div>
          <Button type="submit" className="w-full">
            Save Changes
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
