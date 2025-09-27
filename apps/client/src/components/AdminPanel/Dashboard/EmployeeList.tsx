"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchEmpForDashboard } from "@/services/adminService";
import Link from "next/link";

type Employee = {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  role: string;
};

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetchEmpForDashboard();
        console.log("Emp:", res);
        if (res.success) setEmployees(res.data);
        else toast.error(res.message || "Failed to fetch employees");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load employees");
      }
    }
    loadEmployees();
  }, []);

  return (
    <Card className="h-full shadow-md">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">Employees</CardTitle>
        <Link
          href="/admin/employees" // replace with your actual employee page route
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent>
        {employees.length > 0 ? (
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
        ) : (
          <p className="text-sm text-gray-500">No employees available</p>
        )}
      </CardContent>
    </Card>
  );
}
