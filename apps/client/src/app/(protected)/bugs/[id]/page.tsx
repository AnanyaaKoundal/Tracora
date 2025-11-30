"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBugById } from "@/actions/bugAction";
import { Bug } from "@/schemas/bug.schema";
import { fetchAllAssigneesService } from "@/services/bugService";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import BugInfoLeftPanel from "@/components/Bug/BugInfoLeftPanel";
import BugInfoRightPanel from "@/components/Bug/BugInfoRightPanel";
import { Employee } from "@/schemas/admin.schema";
import BugActivitySection from "@/components/Bug/CommentSection";

export default function BugInfoPage() {
  const { id } = useParams();
  const idParam = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [bug, setBug] = useState<Bug | null>(null);
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

  if (loading) return <div className="p-4">Loading bug details...</div>;
  if (!bug) return <div className="p-4 text-red-600">Bug not found.</div>;

  return (
    <div className="h-screen flex flex-col">
  {/* Header: fixed at top */}
  <div className="p-4 border-b bg-white z-10 sticky top-0">
    <Button variant="ghost" onClick={() => router.push("/bugs")}>
      <ArrowLeft className="h-4 w-4 mr-1" /> Back
    </Button>
  </div>

  {/* Main content: fills remaining space */}
  <div
  className="flex overflow-hidden gap-6 p-8"
  style={{ height: 'calc(100vh - 64px)' }}
>

    {/* Left panel: scrollable */}
    <div className="flex-1 overflow-y-auto pr-4">
      <BugInfoLeftPanel
        bug={bug}
        setBug={setBug}
        activities={activities}
        setActivities={setActivities}
      />
    </div>

    {/* Right panel: sticky/fixed */}
    <div className="w-[320px] flex-shrink-0">
      <div className="sticky top-20">
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
      </div>
    </div>
  </div>
</div>

  );
}
