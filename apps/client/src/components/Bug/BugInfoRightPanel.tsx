"use client";

import { useState } from "react";
import { Bug, BugPriority } from "@/schemas/bug.schema";
import { Employee } from "@/schemas/admin.schema";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Check, Copy, X } from "lucide-react";
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
              .map((id) => employees.find((e) => e.employee_id === id))
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
    <div className="space-y-4 sticky top-8">
      {/* Bug ID */}
      <h5
        className="text-sm text-gray-600 cursor-pointer flex items-center gap-1 font-mono hover:text-gray-900 hover:underline"
        onClick={() => {
          if (bug.bug_id) {
            navigator.clipboard.writeText(bug.bug_id.toString());
            toast.success("Bug ID copied!");
          }
        }}
      >
        <span className="select-text">#{bug.bug_id}</span>
        <Copy size={14} className="opacity-70 hover:opacity-100" />
      </h5>

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            className="border rounded p-2 w-full"
            value={bug.bug_status}
            onChange={(e) => setBug((prev) => (prev ? { ...prev, bug_status: e.target.value as Bug["bug_status"] } : prev))}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            className="border rounded p-2 w-full"
            value={bug.bug_priority}
            onChange={(e) => setBug((prev) => (prev ? { ...prev, bug_priority: Number(e.target.value) as BugPriority } : prev))}
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>{BugPriority[priority]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignee */}
      <div>
        <label className="block text-sm font-medium mb-1">Assigned To</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedEmployee ? `${selectedEmployee.employee_name} (${selectedEmployee.employee_email})` : "Select assignee"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search by name or email..." value={search} onValueChange={setSearch} />
              <CommandEmpty>No matching employees.</CommandEmpty>
              <CommandGroup>
                {employees
                  .filter((emp) => emp.employee_name.toLowerCase().includes(search.toLowerCase()) || (emp.employee_email || "").toLowerCase().includes(search.toLowerCase()))
                  .map((emp) => (
                    <CommandItem key={emp.employee_id} onSelect={() => setSelectedEmployee(emp)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{emp.employee_name}</span>
                        <span className="text-sm text-gray-500">{emp.employee_email}</span>
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
      <div>
        <label className="block text-sm font-medium mb-1">Notify Users</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {notifyUsers.length > 0 ? `${notifyUsers.length} selected` : "Select users to notify"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search users..." value={search} onValueChange={setSearch} />
              <CommandEmpty>No matching users.</CommandEmpty>
              <CommandGroup>
                {employees
                  .filter((emp) => emp.employee_name.toLowerCase().includes(search.toLowerCase()) || (emp.employee_email || "").toLowerCase().includes(search.toLowerCase()))
                  .map((emp) => {
                    const selected = notifyUsers.some((u) => u.employee_id === emp.employee_id);
                    return (
                      <CommandItem key={emp.employee_id} onSelect={() => toggleNotifyUser(emp)}>
                        <div className="flex flex-col">
                          <span className="font-medium">{emp.employee_name}</span>
                          <span className="text-sm text-gray-500">{emp.employee_email}</span>
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
          <div className="mt-3 p-3 border border-primary/20 rounded-lg bg-primary/5">
            <h6 className="text-sm font-semibold text-primary mb-2">Notified Users</h6>
            <div className="flex flex-wrap gap-2">
              {notifyUsers.map((user) => (
                <div key={user.employee_id} className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                  <span>{user.employee_name}</span>
                  <button type="button" aria-label={`Remove ${user.employee_name}`} onClick={() => removeNotifyUser(user.employee_id)} className="p-0.5 rounded-full hover:bg-primary/20">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : "Save Changes"}</Button>
    </div>
  );
}
