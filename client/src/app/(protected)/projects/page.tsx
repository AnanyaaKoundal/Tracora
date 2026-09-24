"use client";

import { useState, useEffect } from "react";
import { DataTable, Column, FilterConfig } from "@/components/Table/DataTable";
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjects,
} from "@/actions/projectAction";
import { fetchRole } from "@/actions/employeeAction";
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
  const [isAdmin, setIsAdmin] = useState(false);

  const getColumns = (): Column<Project>[] => [
    { key: "project_id", header: "ID", sortable: true },
    { key: "project_name", header: "Name", sortable: true },
    { key: "project_status", header: "Status", sortable: true },
    { key: "project_start_date", header: "Start Date", sortable: true },
    {
      key: "project_end_date",
      header: "End Date",
      render: (row) => row.project_end_date || "-",
    },
    { key: "createdAt", header: "Created At", sortable: true },
    ...(isAdmin ? [{
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
    }] : []),
  ];

  const filterFields: FilterConfig[] = [
    {
      key: "project_status",
      label: "Status",
      type: "select",
      options: [
        { value: "Active", label: "Active" },
        { value: "Upcoming", label: "Upcoming" },
        { value: "Completed", label: "Completed" },
        { value: "Inactive", label: "Inactive" },
        { value: "Overdue", label: "Overdue" },
      ],
    },
    {
      key: "project_name",
      label: "Name",
      type: "text",
    },
    {
      key: "created_by",
      label: "Created By",
      type: "text",
    },
    {
      key: "project_start_date",
      label: "Start Date",
      type: "daterange",
    },
    {
      key: "project_end_date",
      label: "End Date",
      type: "daterange",
    },
  ];

  useEffect(() => {
    async function fetchData() {
      const projectData = await getProjects();
      setProjects(projectData);
      
      const roleData = await fetchRole();
      if (roleData.success && roleData.role === "admin") {
        setIsAdmin(true);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your projects and track progress</p>
        </div>
        {isAdmin && (
          <AddProjectDrawer
            onProjectCreated={async () => {
              const fresh = await getAllProjects();
              setProjects(fresh);
            }}
          />
        )}
      </div>

      <DataTable<Project>
        columns={getColumns()}
        data={projects}
        enableSearch={true}
        enableFilters={true}
        filterFields={filterFields}
        searchableFields={["project_id", "project_name", "created_by"] as (keyof Project)[]}
        pageSize={10}
      />

      {/* Edit Drawer */}
      {isAdmin && editingProject && (
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
      {isAdmin && deletingProject && (
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
