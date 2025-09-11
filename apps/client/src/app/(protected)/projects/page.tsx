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
import { Project } from "@/schemas/project.schema";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const columns: Column<Project>[] = [
    { key: "project_id", header: "ID" },
    { key: "project_name", header: "Name" },
    { key: "project_start_date", header: "Start Date" },
    {
      key: "project_end_date",
      header: "End Date",
      render: (row) => row.project_end_date || "-",
    },
    { key: "project_status", header: "Status" },
    { key: "createdAt", header: "Created At" },
    { key: "updatedAt", header: "Updated At" },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      render: (row: Project) => (
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
      const projectData = await getProjects();
      setProjects(projectData);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Projects</h1>
        <AddProjectDrawer
          onProjectCreated={async () => {
            const fresh = await getAllProjects();
            setProjects(fresh);
          }}
        />
      </div>

      <DataTable<Project> columns={columns} data={projects} />

      {/* Edit Drawer */}
      {editingProject && (
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
      )}

      {/* Delete Dialog */}
      {deletingProject && (
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
      )}
    </div>
  );
}
