"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateBugInput, createBugSchema, BugPriority } from "@/schemas/bug.schema";
import { createBug } from "@/actions/bugAction";
import { fetchEmpForDashboard } from "@/services/adminService";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandGroup,
} from "@/components/ui/command";

import { Check } from "lucide-react";

import { fetchAllAssigneesService } from "@/services/bugService";

type Employee = {
  employee_id: string;
  employee_name: string;
  employee_email?: string;
};

export function AddBugDrawer({ onBugCreated }: { onBugCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");

  // Notify Users state
    const [notifyUsers, setNotifyUsers] = useState<Employee[]>([]);
  const form = useForm<CreateBugInput>({
    defaultValues: {
      bug_name: "",
      bug_description: "",
      bug_status: "Open",
      assigned_to: "",
      comments: [],
      bug_priority: BugPriority.Medium,
    },
  });
  function toggleNotifyUser(emp: Employee) {
    const exists = notifyUsers.some(u => u.employee_id === emp.employee_id);
  
    if (exists) {
      setNotifyUsers(notifyUsers.filter(u => u.employee_id !== emp.employee_id));
    } else {
      setNotifyUsers([...notifyUsers, emp]);
    }
  }
   // Auto-include Reporter
useEffect(() => {
  if (currentUser) {
    setNotifyUsers(prev => {
      const already = prev.some(u => u.employee_id === currentUser.employee_id);
      if (!already) return [...prev, currentUser];
      return prev;
    });
  }
}, [currentUser]);

// Auto-include Assignee
useEffect(() => {
  if (selectedAssignee) {
    setNotifyUsers(prev => {
      const exists = prev.some(u => u.employee_id === selectedAssignee.employee_id);
      if (!exists) return [...prev, selectedAssignee];
      return prev;
    });
  }
}, [selectedAssignee]);

  
  useEffect(() => {
      async function fetchEmployees() {
        try {
          const res = await fetchAllAssigneesService();
          if (res.success) {
            setEmployees(res.data);
            setFilteredEmployees(res.data);
          }
            // 🔹 Preselect Assigned Employee
            
        } catch {
          toast.error("Failed to load employees");
        }
      }
      fetchEmployees();
    }, []);

  // Fetch employees and current user
  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetchEmpForDashboard();
        if (res.success) {
          setEmployees(res.data);

          // Mock current user (replace with real session later)
          const user = res.data[0];
          setCurrentUser(user);
        } else toast.error(res.message || "Failed to load employees");
      } catch (err) {
        console.error(err);
        toast.error("Error fetching employees");
      }
    }
    loadEmployees();
  }, []);

  

  const onSubmit = async (data: CreateBugInput) => {
    try {
        const payload = {
            ...data,
            notify_users: notifyUsers.map((u) => u.employee_id),
          };          
      const res = await createBug(payload);
      if (res.success) {
        toast.success("Bug created successfully 🐞");
        form.reset();
        setSelectedAssignee(null);
        setOpen(false);
        onBugCreated();
      } else {
        toast.error(res.message || "Failed to create bug ❌");
      }
    } catch (err) {
      toast.error("Unexpected error while creating bug ❌");
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setSelectedAssignee(null);
        }
      }}
    >
      <SheetTrigger asChild>
        <Button>+ Report Bug</Button>
      </SheetTrigger>

      <SheetContent side="right" className="min-w-1/3 sm:w-1/3 p-5">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-primary">Report a Bug</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-1">
          {/* Bug Name */}
          <div className="space-y-2">
            <Label htmlFor="bug_name">Bug Title</Label>
            <Input
              id="bug_name"
              {...form.register("bug_name")}
              placeholder="Enter bug title"
            />
          </div>

          {/* Bug Description */}
          <div className="space-y-2">
            <Label htmlFor="bug_description">Description</Label>
            <Textarea
              id="bug_description"
              {...form.register("bug_description")}
              placeholder="Describe the bug in detail"
              className="min-h-[140px]" // increased height
            />
          </div>

          {/* Row: Status, Priority, Assigned To */}
          <div className="grid grid-cols-3 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue("bug_status", value as CreateBugInput["bug_status"])
                }
                value={form.watch("bug_status")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Fixed">Fixed</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                onValueChange={(value) =>
                  form.setValue(
                    "bug_priority",
                    parseInt(value) as CreateBugInput["bug_priority"]
                  )
                }
                value={form.watch("bug_priority").toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BugPriority.Critical.toString()}>Critical</SelectItem>
                  <SelectItem value={BugPriority.High.toString()}>High</SelectItem>
                  <SelectItem value={BugPriority.Medium.toString()}>Medium</SelectItem>
                  <SelectItem value={BugPriority.Low.toString()}>Low</SelectItem>
                  <SelectItem value={BugPriority.Trivial.toString()}>Trivial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select
                onValueChange={(value) => {
                  form.setValue("assigned_to", value);
                  const emp = employees.find((e) => e.employee_id === value);
                  setSelectedAssignee(emp || null);
                }}
                value={form.watch("assigned_to")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.employee_id} value={e.employee_id}>
                      {e.employee_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reporter + Assignee (Highlighted Section) */}
          {/* Notify Users */}
          <div>
            <label className="block text-sm font-medium mb-1">Notify Users</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {notifyUsers.length > 0
                    ? `${notifyUsers.length} selected`
                    : "Select users to notify"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search users..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandEmpty>No matching users.</CommandEmpty>
                  <CommandGroup>
                    {filteredEmployees.map((emp) => {
                      const selected = notifyUsers.some(
                        (u) => u.employee_id === emp.employee_id
                      );
                      return (
                        <CommandItem
                          key={emp.employee_id}
                          onSelect={() => toggleNotifyUser(emp)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{emp.employee_name}</span>
                            <span className="text-sm text-gray-500">
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
              <div className="mt-3 p-3 border border-primary/20 rounded-lg bg-primary/5">
              <h6 className="text-sm font-semibold text-primary mb-2">
                Notified Users
              </h6>
              <div className="flex flex-wrap gap-2">
                {notifyUsers.map((user) => (
                  <div
                    key={user.employee_id || user.employee_id}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium"
                  >
                    <span>{user.employee_name}</span>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>


          {/* Submit */}
          <Button type="submit" className="w-full">
            Report Bug
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
