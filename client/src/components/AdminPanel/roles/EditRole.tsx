"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoleSchema } from "@/schemas/admin.schema";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Shield, Save } from "lucide-react";

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
      <SheetContent side="right" className="w-[400px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Edit Role
              </SheetTitle>
              <SheetDescription className="mt-1">
                Update role name and permissions
              </SheetDescription>
            </motion.div>
          </SheetHeader>

          <motion.div 
            className="flex-1 overflow-y-auto p-6 space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-2">
              <Label htmlFor="role_name">Role Name</Label>
              <Input id="role_name" {...register("role_name")} className="h-10" />
            </div>
          </motion.div>

          <div className="p-6 pt-4 border-t bg-muted/20">
            <Button type="submit" onClick={handleSubmit(onSubmit)} className="w-full gap-2 h-10">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
