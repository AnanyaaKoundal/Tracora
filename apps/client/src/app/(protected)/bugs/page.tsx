"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column, FilterConfig } from "@/components/Table/DataTable";
import { getAllBugs, deleteBug } from "@/actions/bugAction";
import { AddBugDrawer } from "@/components/Bug/AddBug";
import { Bug } from "@/schemas/bug.schema";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteProjectDialog } from "@/components/AdminPanel/projects/DeleteProject";

export default function BugsPage() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [deletingBug, setDeletingBug] = useState<Bug | null>(null);
  const router = useRouter();

  const columns: Column<Bug>[] = [
    { key: "bug_id", header: "ID", sortable: true },
    { key: "bug_name", header: "Name", sortable: true },
    { key: "bug_status", header: "Status", sortable: true },
    { key: "bug_priority", header: "Priority", sortable: true },
    { key: "reported_by", header: "Reported By", sortable: true },
    {
      key: "assigned_to",
      header: "Assignee",
      render: (row) => row.assigned_to || "-",
    },
    { key: "createdAt", header: "Created At", sortable: true },
    { key: "updatedAt", header: "Updated At", sortable: true },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      render: (row: Bug) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingBug(row);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const filterFields: FilterConfig[] = [
    {
      key: "bug_status",
      label: "Status",
      type: "select",
      options: [
        { value: "Open", label: "Open" },
        { value: "Under Review", label: "Under Review" },
        { value: "Fixed", label: "Fixed" },
        { value: "Closed", label: "Closed" },
      ],
    },
    {
      key: "bug_priority",
      label: "Priority",
      type: "select",
      options: [
        { value: "1", label: "Critical" },
        { value: "2", label: "High" },
        { value: "3", label: "Medium" },
        { value: "4", label: "Low" },
        { value: "5", label: "Trivial" },
      ],
    },
    {
      key: "reported_by",
      label: "Reported By",
      type: "text",
    },
    {
      key: "assigned_to",
      label: "Assignee",
      type: "text",
    },
    {
      key: "createdAt",
      label: "Created Date",
      type: "daterange",
    },
  ];

  useEffect(() => {
    async function fetchData() {
      const bugData = await getAllBugs();
      setBugs(bugData);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bugs</h1>
          <p className="text-muted-foreground mt-1">Manage and track all reported bugs</p>
        </div>
        <AddBugDrawer
          onBugCreated={async () => {
            const fresh = await getAllBugs();
            setBugs(fresh);
          }}
        />
      </div>

      <DataTable<Bug>
        columns={columns}
        data={bugs}
        onRowClick={(row) => router.push(`/bugs/${row.bug_id}`)}
        enableSearch={true}
        enableFilters={true}
        filterFields={filterFields}
        searchableFields={["bug_id", "bug_name", "reported_by", "assigned_to"] as (keyof Bug)[]}
        pageSize={10}
      />

      {/* Delete Confirmation Dialog */}
      {deletingBug && (
        <DeleteProjectDialog
          open={!!deletingBug}
          onOpenChange={(open: boolean) => {
            if (!open) setDeletingBug(null);
          }}
          projectId={deletingBug.bug_id}
          projectName={deletingBug.bug_name || null}
          onConfirm={async () => {
            const res = await deleteBug(deletingBug.bug_id);
            if (res.success) {
              const fresh = await getAllBugs();
              setBugs(fresh);
              setDeletingBug(null);
            }
            return res;
          }}
        />
      )}
    </div>
  );
}
