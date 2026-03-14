"use client";

import { useState } from "react";
import { Bug, BugPriority } from "@/schemas/bug.schema";
import { Employee } from "@/schemas/admin.schema";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check, Copy, X, User, Bell, Save } from "lucide-react";
import { toast } from "sonner";
import { updateBug } from "@/actions/bugAction";

interface Props {
  bug: Bug;
  setBug: React.Dispatch<React.SetStateAction<Bug | null>>;
  employees: Employee[];
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
  selectedEmployee,
  setSelectedEmployee,
  notifyUsers,
  setNotifyUsers,
  saving,
  setSaving,
}: Props) {
  const [search, setSearch] = useState("");

  const statusOptions: Bug["bug_status"][] = ["Open", "Under Review", "Fixed", "Closed"];
  const priorityOptions = Object.values(BugPriority).filter((v) => typeof v === "number") as number[];

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

  function toggleNotifyUser(emp: Employee) {
    setNotifyUsers((prev) => {
      const exists = prev.find((e) => e.employee_id === emp.employee_id);
      if (exists) return prev.filter((e) => e.employee_id !== emp.employee_id);
      return [...prev, emp];
    });
  }

  function removeNotifyUser(empId: string) {
    setNotifyUsers((prev) => prev.filter((e) => e.employee_id !== empId));
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

      {/* Status */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
        <Select
          value={bug.bug_status}
          onValueChange={(value) => setBug((prev) => (prev ? { ...prev, bug_status: value as Bug["bug_status"] } : prev))}
        >
          <SelectTrigger className="bg-muted/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
        <Select
          value={String(bug.bug_priority)}
          onValueChange={(value) => setBug((prev) => (prev ? { ...prev, bug_priority: Number(value) as BugPriority } : prev))}
        >
          <SelectTrigger className="bg-muted/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((priority) => (
              <SelectItem key={priority} value={String(priority)}>{BugPriority[priority]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignee */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Assigned To</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between bg-muted/30">
              {selectedEmployee ? (
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {selectedEmployee.employee_name}
                </span>
              ) : (
                <span className="text-muted-foreground">Select assignee</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-2">
            <Command>
              <CommandInput placeholder="Search by name or email..." value={search} onValueChange={setSearch} />
              <CommandEmpty>No matching employees.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-y-auto">
                {employees
                  .filter((emp) => emp.employee_name.toLowerCase().includes(search.toLowerCase()) || (emp.employee_email || "").toLowerCase().includes(search.toLowerCase()))
                  .map((emp) => (
                    <CommandItem key={emp.employee_id} onSelect={() => setSelectedEmployee(emp)} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">{emp.employee_name.charAt(0)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{emp.employee_name}</span>
                        <span className="text-xs text-muted-foreground">{emp.employee_email}</span>
                      </div>
                      {selectedEmployee?.employee_id === emp.employee_id && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Notify Users */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Notify Users</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between bg-muted/30">
              {notifyUsers.length > 0 ? (
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  {notifyUsers.length} selected
                </span>
              ) : (
                <span className="text-muted-foreground">Select users to notify</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-2">
            <Command>
              <CommandInput placeholder="Search users..." value={search} onValueChange={setSearch} />
              <CommandEmpty>No matching users.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-y-auto">
                {employees
                  .filter((emp) => emp.employee_name.toLowerCase().includes(search.toLowerCase()) || (emp.employee_email || "").toLowerCase().includes(search.toLowerCase()))
                  .map((emp) => {
                    const selected = notifyUsers.some((u) => u.employee_id === emp.employee_id);
                    return (
                      <CommandItem key={emp.employee_id} onSelect={() => toggleNotifyUser(emp)} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">{emp.employee_name.charAt(0)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{emp.employee_name}</span>
                          <span className="text-xs text-muted-foreground">{emp.employee_email}</span>
                        </div>
                        {selected && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        {notifyUsers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {notifyUsers.map((user) => (
              <div
                key={user.employee_id}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                <span>{user.employee_name}</span>
                <button type="button" aria-label={`Remove ${user.employee_name}`} onClick={() => removeNotifyUser(user.employee_id)} className="p-0.5 rounded-full hover:bg-primary/20">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
