"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoleSchema, CreateRoleInput } from "@/schemas/admin.schema";
import { createRole } from "@/actions/rolesAction"; 
import { toast } from "sonner"; 
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldPlus } from "lucide-react";

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
        toast.success("Role created successfully");
        form.reset();
        setOpen(false); 
        onRoleCreated(); 
      } else {
        toast.error(res.message || "Failed to create role");
      }
    } catch (err) {
      toast.error("Unexpected error while creating role");
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
          <ShieldPlus className="w-4 h-4" />
          Add Role
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldPlus className="w-5 h-5 text-primary" />
                Add New Role
              </SheetTitle>
              <SheetDescription className="mt-1">
                Create a new role for employees
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
              <Label htmlFor="role">Role Name</Label>
              <Input
                id="role"
                {...form.register("role_name")}
                placeholder="Enter role name"
                className="h-10"
              />
              {form.formState.errors.role_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.role_name.message}
                </p>
              )}
            </div>
          </motion.div>

          <div className="p-6 pt-4 border-t bg-muted/20">
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full gap-2 h-10">
              <ShieldPlus className="w-4 h-4" />
              Create Role
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
