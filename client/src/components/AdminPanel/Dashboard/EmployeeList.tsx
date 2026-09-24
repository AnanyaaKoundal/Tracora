"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchEmpForDashboard } from "@/services/adminService";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Mail, ArrowRight } from "lucide-react";

type Employee = {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  role: string;
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  manager: "bg-purple-100 text-purple-700 border-purple-200",
  developer: "bg-blue-100 text-blue-700 border-blue-200",
  tester: "bg-green-100 text-green-700 border-green-200",
};

export default function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetchEmpForDashboard();
        if (res.success) setEmployees(res.data);
        else toast.error(res.message || "Failed to fetch employees");
      } catch (err) {
        toast.error("Failed to load employees");
      } finally {
        setLoading(false);
      }
    }
    loadEmployees();
  }, []);

  return (
    <Card className="h-full shadow-sm border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Team Members
        </CardTitle>
        <Link
          href="/admin/employees"
          className="text-sm font-medium text-primary hover:text-primary/80 transition flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : employees.length > 0 ? (
          <div className="space-y-3">
            {employees.slice(0, 5).map((e, index) => (
              <motion.div
                key={e.employee_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-medium">
                    {e.employee_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{e.employee_name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {e.employee_email}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${roleColors[e.role?.toLowerCase()] || "bg-gray-100 text-gray-700"}`}>
                  {e.role}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No employees available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
