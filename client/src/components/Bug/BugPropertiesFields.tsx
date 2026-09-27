"use client";

import { useState } from "react";
import { Bug, BugPriority } from "@/schemas/bug.schema";
import { Employee } from "@/schemas/admin.schema";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check, X, User, Bell } from "lucide-react";

interface Props {
  bug: Bug;
  setBug: React.Dispatch<React.SetStateAction<Bug | null>>;
  employees: Employee[];
  selectedEmployee: Employee | null;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<Employee | null>>;
  notifyUsers: Employee[];
  setNotifyUsers: React.Dispatch<React.SetStateAction<Employee[]>>;
}

export default function BugPropertiesFields({
  bug,
  setBug,
  employees,
  selectedEmployee,
  setSelectedEmployee,
  notifyUsers,
  setNotifyUsers,
}: Props) {
  const [search, setSearch] = useState("");

  const statusOptions: Bug["bug_status"][] = ["Open", "Under Review", "Fixed", "Closed"];
  const priorityOptions = Object.values(BugPriority).filter(
    (v) => typeof v === "number"
  ) as number[];

  function toggleNotifyUser(emp: Employee) {
    setNotifyUsers((prev) =>
      prev.some((u) => u.employee_id === emp.employee_id)
        ? prev.filter((u) => u.employee_id !== emp.employee_id)
        : [...prev, { ...emp }]
    );
  }

  function removeNotifyUser(empId: string) {
    setNotifyUsers((prev) => prev.filter((u) => u.employee_id !== empId));
  }

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.employee_email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Status */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
        <Select
          value={bug.bug_status}
          onValueChange={(value) =>
            setBug((prev) =>
              prev ? { ...prev, bug_status: value as Bug["bug_status"] } : prev
            )
          }
        >
          <SelectTrigger className="bg-muted/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
        <Select
          value={String(bug.bug_priority)}
          onValueChange={(value) =>
            setBug((prev) =>
              prev
                ? { ...prev, bug_priority: Number(value) as BugPriority }
                : prev
            )
          }
        >
          <SelectTrigger className="bg-muted/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((priority) => (
              <SelectItem key={priority} value={String(priority)}>
                {BugPriority[priority]}
              </SelectItem>
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
              <CommandInput
                placeholder="Search by name or email..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandEmpty>No matching employees.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-y-auto">
                {filteredEmployees.map((emp) => (
                  <CommandItem
                    key={emp.employee_id}
                    onSelect={() => setSelectedEmployee(emp)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {emp.employee_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{emp.employee_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {emp.employee_email}
                      </span>
                    </div>
                    {selectedEmployee?.employee_id === emp.employee_id && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
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
              <CommandInput
                placeholder="Search by name or email..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandEmpty>No matching employees.</CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-y-auto">
                {filteredEmployees.map((emp) => {
                  const selected = notifyUsers.some(
                    (u) => u.employee_id === emp.employee_id
                  );
                  return (
                    <CommandItem
                      key={emp.employee_id}
                      onSelect={() => toggleNotifyUser(emp)}
                      className="flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {emp.employee_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{emp.employee_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {emp.employee_email}
                        </span>
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
                <button
                  type="button"
                  aria-label={`Remove ${user.employee_name}`}
                  onClick={() => removeNotifyUser(user.employee_id)}
                  className="p-0.5 rounded-full hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
