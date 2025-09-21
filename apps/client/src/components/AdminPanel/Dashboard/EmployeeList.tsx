"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { fetchEmployeesService } from "@/services/admin/employeeService"; // hypothetical service
import { toast } from "sonner";

type Employee = {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  role: string;
};

const dummyEmployees: Employee[] = [
  {
    employee_id: "E-101",
    employee_name: "Alice Johnson",
    employee_email: "alice@example.com",
    role: "Manager",
  },
  {
    employee_id: "E-102",
    employee_name: "Bob Smith",
    employee_email: "bob@example.com",
    role: "Developer",
  },
  {
    employee_id: "E-103",
    employee_name: "Charlie Brown",
    employee_email: "charlie@example.com",
    role: "Tester",
  },
  {
    employee_id: "E-104",
    employee_name: "David Lee",
    employee_email: "david@example.com",
    role: "Developer",
  },
  {
    employee_id: "E-105",
    employee_name: "Eve Adams",
    employee_email: "eve@example.com",
    role: "Tester",
  },
];

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>(dummyEmployees);

  useEffect(() => {
    async function loadEmployees() {
      try {
        // const res = await fetchEmployeesService();
        // if (res.success) setEmployees(res.data);
        // else toast.error(res.message || "Failed to fetch employees");
      } catch {
        toast.warning("Using dummy data for employees");
      }
    }
    loadEmployees();
  }, []);

  return (
    <Card className="h-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Employees</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {employees.slice(0, 5).map((e) => (
            <div
              key={e.employee_id}
              className="flex justify-between items-center p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              <div>
                <p className="font-medium">{e.employee_name}</p>
                <p className="text-xs text-gray-600">{e.employee_email}</p>
              </div>
              <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {e.role}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
