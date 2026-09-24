"use client";

import { useState, useEffect, useMemo } from "react";
import { DataTable, Column } from "@/components/Table/DataTable";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getAllProjects,
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

  // Filters
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortField, setSortField] = useState<"project_start_date" | "project_end_date" | "">("");

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
      const projectData = await getAllProjects();
      setProjects(projectData);
    }
    fetchData();
  }, []);

  // Apply filters and sorting
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (search) {
      result = result.filter((proj) =>
        (proj.project_name ?? "").toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus) {
      result = result.filter((proj) => proj.project_status === selectedStatus);
    }

    // Sorting
    if (sortField) {
      result.sort((a, b) => {
        const aVal = a[sortField] ? new Date(a[sortField] as string).getTime() : 0;
        const bVal = b[sortField] ? new Date(b[sortField] as string).getTime() : 0;
        return aVal - bVal;
      });
    }

    return result;
  }, [projects, search, selectedStatus, sortField]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Projects</h1>
        <AddProjectDrawer
          onProjectCreated={async () => {
            const fresh = await getProjects();
            setProjects(fresh);
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">

        {/* Status Dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as any)}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">Sort By</option>
          <option value="project_start_date">Start Date</option>
          <option value="project_end_date">End Date</option>
        </select>

          {/* Search */}
        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-md"
        />

      </div>

      {/* Table */}
      <DataTable<Project> columns={columns} data={filteredProjects} />

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
                const fresh = await getProjects();
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
              const fresh = await getProjects();
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
