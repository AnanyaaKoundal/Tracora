"use client";

import { useState, useEffect } from "react";
import { DataTable, Column } from "@/components/Table/DataTable";
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjects,
} from "@/actions/projectAction";
import { AddProjectDrawer } from "@/components/AdminPanel/projects/AddProject";
import { EditProjectDrawer } from "@/components/AdminPanel/projects/EditProject";
import { DeleteProjectDialog } from "@/components/AdminPanel/projects/DeleteProject";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bug } from "@/schemas/bug.schema";
import { getAllBugs } from "@/actions/bugAction";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Bug[]>([]);
  const [editingProject, setEditingProject] = useState<Bug | null>(null);
  const [deletingProject, setDeletingProject] = useState<Bug | null>(null);

  const columns: Column<Bug>[] = [
    { key: "bug_id", header: "ID" },
    { key: "bug_name", header: "Name" },
    { key: "bug_status", header: "Status" },
    { key: "reported_by", header: "Reported By" },
    {
      key: "assigned_to",
      header: "Assignee",
      render: (row) => row.assigned_to || "-",
    },
    { key: "updatedAt", header: "Updated At" },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      render: (row: Bug) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingProject(row)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeletingProject(row)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  useEffect(() => {
    async function fetchData() {
      const bugData = await getAllBugs();
      setProjects(bugData);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Bugs</h1>
        <AddProjectDrawer
          onProjectCreated={async () => {
            const fresh = await getAllProjects();
            setProjects(fresh);
          }}
        />
      </div>

      <DataTable<Bug> columns={columns} data={projects} />

      {/* Edit Drawer */}
      {/* {editingProject && (
        <EditProjectDrawer
          open={!!editingProject}
          onOpenChange={(open: boolean) => {
            if (!open) setEditingProject(null);
          }}
          project={editingProject}
          onSave={async (id, data) => {
            try {
              const res = await updateProject(id, data);
              if (res.success) {
                const fresh = await getAllProjects();
                setProjects(fresh);
                setEditingProject(null);
              }
              return res;
            } catch (error) {
              console.error("Error updating project:", error);
              return { success: false, message: "Update failed" };
            }
          }}
        />
      )} */}

      {/* Delete Dialog */}
      {/* {deletingProject && (
        <DeleteProjectDialog
          open={!!deletingProject}
          onOpenChange={(open: boolean) => {
            if (!open) setDeletingProject(null);
          }}
          projectId={deletingProject.project_id}
          projectName={deletingProject.project_name || null} 
          onConfirm={async () => {
            const res = await deleteProject(deletingProject.project_id);
            if (res.success) {
              const fresh = await getAllProjects();
              setProjects(fresh);
              setDeletingProject(null);
            }
            return res;
          }}
        />
      )} */}
    </div>
  );
}
