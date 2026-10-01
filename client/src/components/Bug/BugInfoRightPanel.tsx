"use client";

import { Bug, BugPriority } from "@/schemas/bug.schema";
import { Employee } from "@/schemas/admin.schema";
import { Project } from "@/schemas/project.schema";
import { Button } from "@/components/ui/button";
import { Copy, Save } from "lucide-react";
import { toast } from "sonner";
import { updateBug } from "@/actions/bugAction";
import BugPropertiesFields from "./BugPropertiesFields";

interface Props {
  bug: Bug;
  setBug: React.Dispatch<React.SetStateAction<Bug | null>>;
  employees: Employee[];
  projects: Project[];
  selectedEmployee: Employee | null;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<Employee | null>>;
  notifyUsers: Employee[];
  setNotifyUsers: React.Dispatch<React.SetStateAction<Employee[]>>;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function BugInfoRightPanel({
  bug,
  setBug,
  employees,
  projects,
  selectedEmployee,
  setSelectedEmployee,
  notifyUsers,
  setNotifyUsers,
  saving,
  setSaving,
}: Props) {
  async function handleSave() {
    setSaving(true);
    try {
      const res = await updateBug({
        ...bug,
        bug_priority: Number(bug.bug_priority) as BugPriority,
        assigned_to: selectedEmployee?.employee_id || bug.assigned_to,
        notify_users: notifyUsers.map((u) => u.employee_id),
      });

      if (res.success) {
        toast.success("Bug updated successfully!");
        if (res.data) {
          setBug((prev) => ({ ...prev!, ...res.data }));

          const emp = employees.find((e) => e.employee_id === res.data.assigned_to);
          setSelectedEmployee(emp || null);

          if (Array.isArray(res.data.notify_users)) {
            const newNotify = res.data.notify_users
              .map((id: string) => employees.find((e) => e.employee_id === id))
              .filter((e): e is Employee => Boolean(e));
            setNotifyUsers(newNotify);
          }
        }
      } else toast.error(res.message || "Failed to update bug.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update bug.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Bug ID - Copyable */}
      <div
        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
        onClick={() => {
          if (bug.bug_id) {
            navigator.clipboard.writeText(bug.bug_id.toString());
            toast.success("Bug ID copied!");
          }
        }}
      >
        <span className="text-xs font-mono text-muted-foreground">#{bug.bug_id}</span>
        <Copy size={14} className="text-muted-foreground ml-auto" />
      </div>

      <BugPropertiesFields
        bug={bug}
        setBug={setBug}
        employees={employees}
        projects={projects}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        notifyUsers={notifyUsers}
        setNotifyUsers={setNotifyUsers}
      />

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
