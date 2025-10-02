"use client";

import { useState, useEffect, useMemo } from "react";
import { DataTable, Column } from "@/components/Table/DataTable";
import {
  getEmployees,
  updateEmployee,
  deleteEmployee,
} from "@/actions/employeeAction";
import { AddEmployeeDrawer } from "@/components/AdminPanel/employee/AddEmployee";
import { EditEmployeeDrawer } from "@/components/AdminPanel/employee/EditEmployee";
import { DeleteEmployeeDialog } from "@/components/AdminPanel/employee/DeleteEmployee";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Employee, Role, Project } from "@/schemas/admin.schema";

// ⬇️ You’ll need APIs to fetch roles & projects too
import { getRoles } from "@/actions/rolesAction";
import { getAllProjects } from "@/actions/projectAction";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null
  );

  const columns: Column<Employee>[] = [
    { key: "employee_id", header: "ID" },
    { key: "employee_name", header: "Name" },
    { key: "employee_email", header: "Email" },
    { key: "employee_contact_number", header: "Contact No" },
    {
      key: "role_names",
      header: "Roles",
      render: (row) => row.role_names?.join(", ") || "-",
    },
    {
      key: "project_name",
      header: "Project",
      render: (row) => row.project_name || "-",
    },
    { key: "createdAt", header: "Created At" },
    { key: "updatedAt", header: "Modified At" },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      render: (row: Employee) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingEmployee(row)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeletingEmployee(row)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      const [employeesData, rolesData, projectsData] = await Promise.all([
        getEmployees(),
        getRoles(),
        getAllProjects(),
      ]);
      setEmployees(employeesData);
      setRoles(rolesData);
      setProjects(projectsData);
    }
    fetchData();
  }, []);

  // Apply filters
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.employee_email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = selectedRole
        ? emp.role_names?.includes(selectedRole)
        : true;

      const matchesProject = selectedProject
        ? emp.project_name === selectedProject
        : true;

      return matchesSearch && matchesRole && matchesProject;
    });
  }, [employees, search, selectedRole, selectedProject]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Employees</h1>
        <AddEmployeeDrawer
          onEmployeeCreated={async () => {
            const fresh = await getEmployees();
            setEmployees(fresh);
          }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role.role_id} value={role.role_name}>
              {role.role_name}
            </option>
          ))}
        </select>

        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border px-3 py-2 rounded-md"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.project_id} value={project.project_name}>
              {project.project_name}
            </option>
          ))}
        </select>
          <input
            type="text"
            placeholder="Search by name/email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-md"
          />
      </div>

      {/* Table */}
      <DataTable<Employee> columns={columns} data={filteredEmployees} />

      {/* Edit Drawer */}
      {editingEmployee && (
        <EditEmployeeDrawer
          open={!!editingEmployee}
          onOpenChange={(open: boolean) => {
            if (!open) setEditingEmployee(null);
          }}
          employee={editingEmployee}
          roles={roles}
          projects={projects}
          onSave={async (id, data) => {
            try {
              const res = await updateEmployee(id, data);

              if (res.success) {
                const freshEmployees = await getEmployees();
                setEmployees(freshEmployees);
                setEditingEmployee(null);
              }

              return res;
            } catch (error) {
              console.error("Error updating employee:", error);
              return { success: false, message: "Update failed" };
            }
          }}
        />
      )}

      {/* Delete Dialog */}
      {deletingEmployee && (
        <DeleteEmployeeDialog
          open={!!deletingEmployee}
          onOpenChange={(open: boolean) => {
            if (!open) setDeletingEmployee(null);
          }}
          employeeId={deletingEmployee.employee_id}
          employeeEmail={deletingEmployee.employee_email}
          onConfirm={async () => {
            const res = await deleteEmployee(deletingEmployee.employee_id);
            if (res.success) {
              const fresh = await getEmployees();
              setEmployees(fresh);
              setDeletingEmployee(null);
            }
            return res;
          }}
        />
      )}
    </div>
  );
}
