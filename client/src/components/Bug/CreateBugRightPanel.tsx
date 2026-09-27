"use client";

import { Bug } from "@/schemas/bug.schema";
import { Employee } from "@/schemas/admin.schema";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import BugPropertiesFields from "./BugPropertiesFields";

interface Props {
  bug: Bug;
  setBug: React.Dispatch<React.SetStateAction<Bug | null>>;
  employees: Employee[];
  selectedEmployee: Employee | null;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<Employee | null>>;
  notifyUsers: Employee[];
  setNotifyUsers: React.Dispatch<React.SetStateAction<Employee[]>>;
  duplicateCount: number;
  submitting: boolean;
  onSubmit: () => void;
  disabled?: boolean;
}

export default function CreateBugRightPanel({
  bug,
  setBug,
  employees,
  selectedEmployee,
  setSelectedEmployee,
  notifyUsers,
  setNotifyUsers,
  duplicateCount,
  submitting,
  onSubmit,
  disabled,
}: Props) {
  return (
    <div className="space-y-5">
      <BugPropertiesFields
        bug={bug}
        setBug={setBug}
        employees={employees}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        notifyUsers={notifyUsers}
        setNotifyUsers={setNotifyUsers}
      />

      <Button
        onClick={onSubmit}
        disabled={submitting || disabled}
        className="w-full gap-2"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {submitting
          ? "Creating..."
          : duplicateCount > 0
          ? `Create Bug · ${duplicateCount} possible duplicate${duplicateCount > 1 ? "s" : ""}`
          : "Create Bug"}
      </Button>
    </div>
  );
}
