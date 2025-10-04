"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBugById, updateBug } from "@/actions/bugAction";
import { Bug, BugPriority } from "@/schemas/bug.schema";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Check, ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { fetchAllAssigneesService } from "@/services/bugService";

type Employee = {
  employee_id: string;
  employee_name: string;
  employee_email: string;
};

type Activity = {
  id: string;
  type: "status" | "description" | "comment" | "assignment";
  message: string;
  createdBy: string;
  createdAt: string;
};

export default function BugInfoPage() {
  const { id } = useParams();
  const idParam = Array.isArray(id) ? id[0] : id;

  const router = useRouter();

  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Employee state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");

  // Activity + Comments
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState("");

  // Fetch bug details
  useEffect(() => {
    async function fetchBug() {
      if (!idParam) return;
      try {
        const res = await getBugById(idParam);
        if (res.success) {
          setBug(res.data);
          setActivities([
            {
              id: "1",
              type: "status",
              message: "Bug created with status Open",
              createdBy: res.data.reported_by,
              createdAt: new Date(res.data.createdAt).toLocaleString(),
            },
          ]);
        } else toast.error(res.message || "Failed to fetch bug");
      } catch {
        toast.error("Failed to fetch bug.");
      } finally {
        setLoading(false);
      }
    }
    fetchBug();
  }, [idParam]);

  // Fetch employees
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetchAllAssigneesService();
        if (res.success) {
          setEmployees(res.data);
          setFilteredEmployees(res.data);

          if (bug?.assigned_to) {
            const emp = res.data.find((e: Employee) => e.employee_id === bug.assigned_to);
            if (emp) setSelectedEmployee(emp);
          }
        }
      } catch {
        toast.error("Failed to load employees");
      }
    }
    fetchEmployees();
  }, [bug]);

  // Filter employees
  useEffect(() => {
    if (!search) {
      setFilteredEmployees(employees);
    } else {
      const lower = search.toLowerCase();
      setFilteredEmployees(
        employees.filter(
          (emp) =>
            emp.employee_name.toLowerCase().includes(lower) ||
            emp.employee_email.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, employees]);

  if (loading) return <div className="p-4">Loading bug details...</div>;
  if (!bug) return <div className="p-4 text-red-600">Bug not found.</div>;

  const statusOptions: Bug["bug_status"][] = ["Open", "Under Review", "Fixed", "Closed"];
  const priorityOptions = Object.values(BugPriority).filter((v) => typeof v === "number") as number[];

  async function handleSave() {
    if (!bug) return;
    setSaving(true);
    try {
      const res = await updateBug({
        ...bug,
        bug_priority: Number(bug.bug_priority) as BugPriority,
      });
      if (res.success) {
        toast.success("Bug updated successfully!");
        setActivities((prev) => [
          {
            id: Date.now().toString(),
            type: "status",
            message: "Bug details updated",
            createdBy: "currentUser",
            createdAt: new Date().toLocaleString(),
          },
          ...prev,
        ]);
      } else {
        toast.error(res.message || "Failed to update bug.");
      }
    } catch {
      toast.error("Failed to update bug.");
    } finally {
      setSaving(false);
    }
  }

  function handleAddComment() {
    if (!newComment.trim()) return;
    setActivities((prev) => [
      {
        id: Date.now().toString(),
        type: "comment",
        message: newComment,
        createdBy: "currentUser",
        createdAt: new Date().toLocaleString(),
      },
      ...prev,
    ]);
    setNewComment("");
  }

  return (
    <div className="w-full min-h-screen p-8 space-y-6">
      {/* Header */}
      <Button variant="ghost" onClick={() => router.push("/bugs")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <div className="grid grid-cols-10 gap-6">
        <div className="col-span-7 space-y-4">
          <input
            type="text"
            value={bug.bug_name}
            onChange={(e) =>
              setBug((prev) =>
                prev ? { ...prev, bug_name: e.target.value } : prev
              )
            }
            className="text-2xl font-bold border-b focus:outline-none focus:border-black ml-2"
          />
        </div>
        <div className="col-span-3 space-y-4 pl-4">
          <h5
            className="text-sm text-gray-600 cursor-pointer flex items-center gap-1 font-mono hover:text-gray-900 hover:underline"
            onClick={() => {
              if (bug?.bug_id) {
                navigator.clipboard.writeText(bug.bug_id.toString());
                toast.success("Bug ID copied!");
              }
            }}
          >
            <span className="select-text">#{bug?.bug_id}</span>
            <Copy size={14} className="opacity-70 hover:opacity-100" />
          </h5>
        </div>

      </div>

      {/* Layout 70/30 */}
      <div className="grid grid-cols-10 gap-6">
        {/* Left - Description */}
        <div className="col-span-7 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="border rounded p-2 w-full h-80"
              value={bug.bug_description}
              onChange={(e) =>
                setBug((prev) =>
                  prev ? { ...prev, bug_description: e.target.value } : prev
                )
              }
              rows={10}
            />
          </div>
        </div>

        {/* Right - Details */}
        <div className="col-span-3 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="border rounded p-2 w-full"
              value={bug.bug_status}
              onChange={(e) =>
                setBug((prev) =>
                  prev ? { ...prev, bug_status: e.target.value as Bug["bug_status"] } : prev
                )
              }
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              className="border rounded p-2 w-full"
              value={bug.bug_priority}
              onChange={(e) =>
                setBug((prev) =>
                  prev
                    ? { ...prev, bug_priority: Number(e.target.value) as BugPriority }
                    : prev
                )
              }
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {BugPriority[priority]}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium mb-1">Assigned To</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  {selectedEmployee
                    ? `${selectedEmployee.employee_name} (${selectedEmployee.employee_email})`
                    : "Select assignee"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search by name or email..."
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandEmpty>No matching employees.</CommandEmpty>
                  <CommandGroup>
                    {filteredEmployees.map((emp) => (
                      <CommandItem
                        key={emp.employee_id}
                        onSelect={() => {
                          setSelectedEmployee(emp);
                          setBug((prev) =>
                            prev ? { ...prev, assigned_to: emp.employee_id } : prev
                          );
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{emp.employee_name}</span>
                          <span className="text-sm text-gray-500">{emp.employee_email}</span>
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

          {/* Reported Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Reported Date</label>
            <p className="text-gray-700">
              {new Date(bug.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Save / Cancel */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/bugs")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Activity / Comments */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Activity & Comments</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Write a comment..."
            className="flex-1 border rounded p-2"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button onClick={handleAddComment}>Post</Button>
        </div>
        <div className="space-y-3">
          {activities.map((act) => (
            <div
              key={act.id}
              className="border rounded p-3 text-sm bg-gray-50 flex justify-between"
            >
              <div>
                <p>{act.message}</p>
                <span className="text-gray-500 text-xs">
                  by {act.createdBy} on {act.createdAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
