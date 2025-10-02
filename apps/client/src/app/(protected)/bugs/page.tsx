"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable, Column } from "@/components/Table/DataTable";
import { getAllBugs, deleteBug } from "@/actions/bugAction";
import { AddBugDrawer } from "@/components/Bug/AddBug";
import { Bug } from "@/schemas/bug.schema";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteProjectDialog } from "@/components/AdminPanel/projects/DeleteProject";

export default function BugsPage() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [deletingBug, setDeletingBug] = useState<Bug | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [reporterFilter, setReporterFilter] = useState("");
  const router = useRouter();

  const columns: Column<Bug>[] = [
    { key: "bug_id", header: "ID", sortable: true },
    { key: "bug_name", header: "Name", sortable: true },
    { key: "bug_status", header: "Status", sortable: true },
    { key: "reported_by", header: "Reported By", sortable: true },
    {
      key: "assigned_to",
      header: "Assignee",
      render: (row) => row.assigned_to || "-",
    },
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
              e.stopPropagation(); // prevents row click
              setDeletingBug(row);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    async function fetchData() {
      const bugData = await getAllBugs();
      setBugs(bugData);
    }
    fetchData();
  }, []);

  // Apply filters
  const filteredBugs = bugs.filter((bug) => {
    return (
      (statusFilter === "" || bug.bug_status === statusFilter) &&
      (reporterFilter === "" || bug.reported_by?.toLowerCase().includes(reporterFilter.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Bugs</h1>
        <AddBugDrawer
          onBugCreated={async () => {
            const fresh = await getAllBugs();
            setBugs(fresh);
          }}
        />
      </div>

      <DataTable<Bug>
        columns={columns}
        data={filteredBugs}
        onRowClick={(row) => router.push(`/bugs/${row.bug_id}`)}
        filters={
          <>
            {/* Status Filter */}
            <select
              className="border px-2 py-1 rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="Open">Open</option>
              <option value="Under Review">Under Review</option>
              <option value="Closed">Closed</option>
              <option value="Fixed">Fixed</option>
            </select>

            {/* Reporter Filter */}
            <input
              type="text"
              placeholder="Filter by Reporter"
              className="border px-2 py-1 rounded"
              value={reporterFilter}
              onChange={(e) => setReporterFilter(e.target.value)}
            />
          </>
        }
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
