"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBug } from "@/actions/bugAction";
import { fetchAllAssigneesService } from "@/services/bugService";
import { fetchCompanyProjectsService } from "@/services/projectService";
import { Bug as BugSchema, BugPriority, CreateBugInput } from "@/schemas/bug.schema";
import { Employee } from "@/schemas/admin.schema";
import { Project } from "@/schemas/project.schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bug as BugIcon, Flag } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import CreateBugForm from "@/components/Bug/CreateBugForm";
import CreateBugRightPanel from "@/components/Bug/CreateBugRightPanel";
import { useAssistantContext } from "@/hooks/useAssistantContext";

const emptyDraft = (): BugSchema => ({
  bug_id: "",
  bug_name: "",
  bug_description: "",
  bug_status: "Open",
  reported_by: "",
  bug_priority: BugPriority.Medium,
  comments: [],
  createdAt: "",
  updatedAt: "",
  notify_users: [],
  project_id: "",
});

export default function CreateBugPage() {
  const router = useRouter();

  const [bug, setBug] = useState<BugSchema | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  // Validation messaging is suppressed until the first submit attempt, so the form
  // does not greet the user with errors before they have typed anything.
  const [showValidation, setShowValidation] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [notifyUsers, setNotifyUsers] = useState<Employee[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);

  useEffect(() => {
    setBug(emptyDraft());
  }, []);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetchAllAssigneesService();
        if (res.success) setEmployees(res.data);
        else toast.error("Failed to load employees");
      } catch {
        toast.error("Failed to load employees");
      }
    }
    loadEmployees();
  }, []);

  useEffect(() => {
    async function loadProjects() {
      try {
        // Tenant-wide list, so a developer can file against any project in their own
        // company rather than being limited to the admin view.
        const res = await fetchCompanyProjectsService();
        if (res?.success && Array.isArray(res.data)) setProjects(res.data);
      } catch {
        // Non-fatal: the form will show "no projects available" and block submit.
      }
    }
    loadProjects();
  }, []);

  // The assistant sees the in-progress draft, so it can check the description against
  // existing bugs while the user is still writing it.
  useAssistantContext(
    bug
      ? {
          kind: "draft",
          label: "New bug",
          data: { title: bug.bug_name, description: bug.bug_description },
        }
      : null,
    bug ? `draft:${bug.bug_name}:${bug.bug_description}` : "draft:loading"
  );

  if (!bug) return null;

  const isValid =
    bug.bug_name.trim().length > 0 &&
    bug.bug_description.trim().length > 0 &&
    (bug.project_id ?? "").trim().length > 0;

  async function handleSubmit() {
    if (!bug) return;

    if (!isValid) {
      setShowValidation(true);
      const missing: string[] = [];
      if (!bug.bug_name.trim()) missing.push("title");
      if (!bug.bug_description.trim()) missing.push("description");
      if (!(bug.project_id ?? "").trim()) missing.push("project");
      toast.error(`Add a ${missing.join(", ")} to create this bug.`);
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateBugInput = {
        bug_name: bug.bug_name.trim(),
        bug_description: bug.bug_description.trim(),
        bug_status: bug.bug_status,
        assigned_to: selectedEmployee?.employee_id ?? "",
        bug_priority: Number(bug.bug_priority) as BugPriority,
        notify_users: notifyUsers.map((u) => u.employee_id),
        comments: [],
        project_id: bug.project_id ?? "",
      };

      const res = await createBug(payload);

      if (!res.success) {
        toast.error(res.message || "Failed to create bug");
        return;
      }

      const created = (res.data as any)?.data;
      toast.success("Bug created successfully");

      if (created?.bug_id) {
        router.push(`/bugs/${created.bug_id}`);
      } else {
        router.push("/bugs");
      }
    } catch {
      toast.error("Unexpected error while creating bug");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/bugs")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Create Bug</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Describe the problem to help the team fix it
            </p>
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
        {/* Left - Details */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BugIcon className="w-5 h-5 text-primary" />
                Bug Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreateBugForm
                bug={bug}
                setBug={setBug}
                onOpenBug={(bugId) => router.push(`/bugs/${bugId}`)}
                onDuplicateCountChange={setDuplicateCount}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right - Properties */}
        <div>
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Flag className="w-5 h-5 text-primary" />
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CreateBugRightPanel
                bug={bug}
                setBug={setBug}
                employees={employees}
                projects={projects}
                showProjectError={showValidation}
                selectedEmployee={selectedEmployee}
                setSelectedEmployee={setSelectedEmployee}
                notifyUsers={notifyUsers}
                setNotifyUsers={setNotifyUsers}
                duplicateCount={duplicateCount}
                submitting={submitting}
                onSubmit={handleSubmit}
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
