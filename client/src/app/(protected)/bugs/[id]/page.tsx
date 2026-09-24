"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBugById } from "@/actions/bugAction";
import { Bug as BugSchema } from "@/schemas/bug.schema";
import { fetchAllAssigneesService } from "@/services/bugService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bug, User, Flag, Bell, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import BugInfoLeftPanel from "@/components/Bug/BugInfoLeftPanel";
import BugInfoRightPanel from "@/components/Bug/BugInfoRightPanel";
import { Employee } from "@/schemas/admin.schema";
import BugActivitySection from "@/components/Bug/CommentSection";
import { motion } from "framer-motion";

export default function BugInfoPage() {
  const { id } = useParams();
  const idParam = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [bug, setBug] = useState<BugSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [notifyUsers, setNotifyUsers] = useState<Employee[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBug() {
      if (!idParam) return;
      setLoading(true);
      try {
        const res = await getBugById(idParam);
        if (res.success) {
          setBug(res.data);
          setActivities([
            {
              id: "1",
              type: "status",
              message: "Bug created with status Open",
              createdBy: res.data.reported_by || "unknown",
              createdAt: new Date(res.data.createdAt).toLocaleString(),
            },
          ]);
        } else toast.error(res.message || "Failed to fetch bug");
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch bug.");
      } finally {
        setLoading(false);
      }
    }
    fetchBug();
  }, [idParam]);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetchAllAssigneesService();
        if (res.success) setEmployees(res.data);
        else toast.error(res.message || "Failed to load employees");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load employees");
      }
    }
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!bug || employees.length === 0) return;

    const emp = employees.find((e) => e.employee_id === bug.assigned_to);
    setSelectedEmployee(emp || null);

    if (Array.isArray(bug.notify_users)) {
      const initialNotify = bug.notify_users
        .map((id) => employees.find((e) => e.employee_id === id))
        .filter((e): e is Employee => Boolean(e));
      setNotifyUsers(initialNotify);
    } else setNotifyUsers([]);
  }, [bug, employees]);

  if (loading) return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[600px] bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-[400px] bg-gray-200 rounded-xl animate-pulse" />
      </div>
    </div>
  );

  if (!bug) return (
    <div className="flex items-center justify-center min-h-[400px] bg-slate-50/50">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive opacity-30" />
        <p className="text-xl font-semibold text-destructive">Bug not found</p>
        <Button variant="link" onClick={() => router.push("/bugs")} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bugs
        </Button>
      </div>
    </div>
  );

  const statusColors: Record<string, string> = {
    "Open": "bg-red-100 text-red-700 border-red-200",
    "Under Review": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Fixed": "bg-green-100 text-green-700 border-green-200",
    "Closed": "bg-gray-100 text-gray-700 border-gray-200",
  };

  const priorityLabels: Record<number, string> = {
    1: "Critical",
    2: "High", 
    3: "Medium",
    4: "Low",
    5: "Trivial",
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/bugs")} className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-foreground">{bug.bug_name}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[bug.bug_status] || 'bg-gray-100 text-gray-700'}`}>
                  {bug.bug_status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-mono">#{bug.bug_id}</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left Panel - Details & Comments */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Bug className="w-5 h-5 text-primary" />
                Bug Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BugInfoLeftPanel
                bug={bug}
                setBug={setBug}
                activities={activities}
                setActivities={setActivities}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Properties */}
        <div className="space-y-6">
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Flag className="w-5 h-5 text-primary" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BugInfoRightPanel
                bug={bug}
                setBug={setBug}
                employees={employees}
                selectedEmployee={selectedEmployee}
                setSelectedEmployee={setSelectedEmployee}
                notifyUsers={notifyUsers}
                setNotifyUsers={setNotifyUsers}
                saving={saving}
                setSaving={setSaving}
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
