"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateBugInput, createBugSchema, BugPriority } from "@/schemas/bug.schema";
import { createBug } from "@/actions/bugAction";
import { toast } from "sonner";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

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

import { Check, Plus, X, User, Bell } from "lucide-react";

import { motion } from "framer-motion";
import { fetchAllAssigneesService } from "@/services/bugService";
import { fetchRole } from "@/actions/employeeAction";

type Employee = {
  employee_id: string;
  employee_name: string;
  employee_email?: string;
};

type NotifyUser = Employee & {
  source: 'reporter' | 'assignee' | 'manual';
};

export function AddBugDrawer({ onBugCreated }: { onBugCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");
  const [notifyUsers, setNotifyUsers] = useState<NotifyUser[]>([]);
  const [previousAssigneeId, setPreviousAssigneeId] = useState<string | null>(null);
  
  const filteredEmployees = employees.filter(emp => 
    emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
    emp.employee_email?.toLowerCase().includes(search.toLowerCase())
  );
  
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
      setNotifyUsers([...notifyUsers, { ...emp, source: 'manual' }]);
    }
  }

  useEffect(() => {
    if (currentUser) {
      setNotifyUsers(prev => {
        const already = prev.some(u => u.employee_id === currentUser.employee_id);
        if (!already) return [...prev, { ...currentUser, source: 'reporter' }];
        return prev;
      });
    }
  }, [currentUser]);

  useEffect(() => {
    // When assignee changes, handle notify users
    if (selectedAssignee) {
      // Add new assignee to notify if not already there
      setNotifyUsers(prev => {
        const existing = prev.find(u => u.employee_id === selectedAssignee.employee_id);
        if (existing) {
          // If already in notify (reporter or manual), don't change source, just keep them
          return prev;
        }
        return [...prev, { ...selectedAssignee, source: 'assignee' }];
      });
      
      // Remove previous assignee if it was added via assignee source (not reporter or manual)
      if (previousAssigneeId && previousAssigneeId !== selectedAssignee.employee_id) {
        setNotifyUsers(prev => {
          const prevAssignee = prev.find(u => u.employee_id === previousAssigneeId);
          // Only remove if it was added specifically via assignee selection
          // Keep them if they were reporter or manually added
          if (prevAssignee && prevAssignee.source === 'assignee') {
            return prev.filter(u => u.employee_id !== previousAssigneeId);
          }
          return prev;
        });
      }
      
      setPreviousAssigneeId(selectedAssignee.employee_id);
    } else if (previousAssigneeId) {
      // Assignee was cleared - remove previous if it was added via assignee only
      setNotifyUsers(prev => {
        const prevAssignee = prev.find(u => u.employee_id === previousAssigneeId);
        // Only remove if added via assignee (not reporter or manual)
        if (prevAssignee && prevAssignee.source === 'assignee') {
          return prev.filter(u => u.employee_id !== previousAssigneeId);
        }
        return prev;
      });
      setPreviousAssigneeId(null);
    }
  }, [selectedAssignee]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        // First get current user info
        const roleData = await fetchRole();
        const employeeId = roleData.employee_id;
        
        const res = await fetchAllAssigneesService();
        const employeeList = res.data || res;
        if (Array.isArray(employeeList)) {
          setEmployees(employeeList);
          // Find the actual current user based on fetched employeeId
          if (employeeId) {
            const currentEmp = employeeList.find((e: Employee) => e.employee_id === employeeId);
            if (currentEmp) {
              setCurrentUser(currentEmp);
            }
          }
        } else {
          console.error("Invalid employee data:", res);
          setEmployees([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching employees");
      }
    }
    if (open) loadEmployees();
  }, [open]);

  const onSubmit = async (data: CreateBugInput) => {
    try {
      const payload = {
        ...data,
        notify_users: notifyUsers.map((u) => u.employee_id),
      };          
      const res = await createBug(payload);
      if (res.success) {
        toast.success("Bug created successfully");
        form.reset();
        setSelectedAssignee(null);
        setNotifyUsers([]);
        setPreviousAssigneeId(null);
        setSearch("");
        setOpen(false);
        onBugCreated();
      } else {
        toast.error(res.message || "Failed to create bug");
      }
    } catch (err) {
      toast.error("Unexpected error while creating bug");
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
          setNotifyUsers([]);
          setPreviousAssigneeId(null);
        }
      }}
    >
      <SheetTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Report Bug
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[550px] sm:w-[600px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Report a Bug
              </SheetTitle>
              <SheetDescription className="mt-1">
                Describe the bug in detail to help the team fix it
              </SheetDescription>
            </motion.div>
          </SheetHeader>

          <motion.div 
            className="flex-1 overflow-y-auto p-6 space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* Bug Name */}
            <div className="space-y-2">
              <Label htmlFor="bug_name">Bug Title</Label>
              <Input
                id="bug_name"
                {...form.register("bug_name")}
                placeholder="Enter bug title"
                className="h-10"
              />
            </div>

            {/* Bug Description */}
            <div className="space-y-2">
              <Label htmlFor="bug_description">Description</Label>
              <Textarea
                id="bug_description"
                {...form.register("bug_description")}
                placeholder="Describe the bug in detail"
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Row: Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  onValueChange={(value) =>
                    form.setValue("bug_status", value as CreateBugInput["bug_status"])
                  }
                  value={form.watch("bug_status")}
                >
                  <SelectTrigger className="h-10">
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
                  <SelectTrigger className="h-10">
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
            </div>

            {/* Assign To - Full width row */}
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-10">
                    {selectedAssignee ? (
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {selectedAssignee.employee_name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select employee</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-2">
                  <Command>
                    <CommandInput
                      placeholder="Search users..."
                    />
                    <CommandEmpty>No matching users.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                      <CommandItem
                        onSelect={() => {
                          form.setValue("assigned_to", "");
                          setSelectedAssignee(null);
                        }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-muted-foreground">-- No Assignment --</span>
                      </CommandItem>
                      {employees.map((emp) => (
                        <CommandItem
                          key={emp.employee_id}
                          onSelect={() => {
                            form.setValue("assigned_to", emp.employee_id);
                            setSelectedAssignee(emp);
                          }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">{emp.employee_name.charAt(0)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{emp.employee_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {emp.employee_email}
                            </span>
                          </div>
                          {selectedAssignee?.employee_id === emp.employee_id && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Notify Users */}
            <div className="space-y-2">
              <Label>Notify Users</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-10">
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
                <PopoverContent className="w-[350px] p-2">
                  <Command>
                    <CommandInput
                      placeholder="Search users..."
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandEmpty>No matching users.</CommandEmpty>
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
                              <span className="text-xs font-medium">{emp.employee_name.charAt(0)}</span>
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
                      <User className="w-3 h-3" />
                      <span>{user.employee_name}</span>
                      <button type="button" onClick={() => toggleNotifyUser(user)} className="p-0.5 rounded-full hover:bg-primary/20">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <div className="p-6 pt-4 border-t bg-muted/20">
            <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full gap-2 h-10">
              <Plus className="w-4 h-4" />
              Submit Bug Report
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
