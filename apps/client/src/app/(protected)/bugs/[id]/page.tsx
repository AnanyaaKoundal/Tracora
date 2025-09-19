"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBugById, updateBug } from "@/actions/bugAction";
import { getEmployees } from "@/actions/employeeAction"; // <-- must exist in your backend
import { Bug } from "@/schemas/bug.schema";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandGroup, CommandItem, CommandEmpty } from "@/components/ui/command";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { fetchAllAssigneesService } from "@/services/bugService";

type Employee = {
  employee_id: string;
  employee_name: string;
  employee_email: string;
};

export default function BugInfoPage() {
  const { id } = useParams();
  const idParam = Array.isArray(id) ? id[0] : id;

  const router = useRouter();

  const [bug, setBug] = useState<Bug | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Employee Search State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");

  // Fetch bug details
  useEffect(() => {
    async function fetchBug() {
      if (!idParam) return;
      try {
        const res = await getBugById(idParam);
        if (res.success) setBug(res.data);
        else toast.error(res.message || "Failed to fetch bug");
      } catch {
        toast.error("Failed to fetch bug.");
      } finally {
        setLoading(false);
      }
    }
    fetchBug();
  }, [idParam]);

  // Fetch employees once bug is loaded
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetchAllAssigneesService();
        console.log(res);
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
  }, []);

  // Filter employees when search changes
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

  async function handleSave() {
    if (!bug) return;
    setSaving(true);
    try {
      const res = await updateBug(bug);
      if (res.success) {
        toast.success("Bug updated successfully!");
        router.push("/bugs");
      } else {
        toast.error(res.message || "Failed to update bug.");
      }
    } catch {
      toast.error("Failed to update bug.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl p-12 space-y-6">
      <h1 className="text-2xl font-bold">Edit Bug</h1>

      {/* Bug Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Bug Name</label>
        <input
          type="text"
          className="border rounded p-2 w-full"
          value={bug.bug_name}
          onChange={(e) =>
            setBug((prev) => prev && { ...prev, bug_name: e.target.value })
          }
        />
      </div>

      {/* Bug Status */}
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

      {/* Assigned To - Searchable Dropdown */}
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

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          className="border rounded p-2 w-full"
          value={bug.bug_description}
          onChange={(e) =>
            setBug((prev) =>
              prev ? { ...prev, bug_description: e.target.value } : prev
            )
          }
          rows={4}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/bugs")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
