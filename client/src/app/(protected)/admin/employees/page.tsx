"use client";

import { useState, useEffect } from "react";
import { DataTable, Column, FilterConfig } from "@/components/Table/DataTable";
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

import { getRoles } from "@/actions/rolesAction";
import { getAllProjects } from "@/actions/projectAction";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const columns: Column<Employee>[] = [
    { key: "employee_id", header: "ID", sortable: true },
    { key: "employee_name", header: "Name", sortable: true },
    { key: "employee_email", header: "Email", sortable: true },
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
    { key: "createdAt", header: "Created At", sortable: true },
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

  const filterFields: FilterConfig[] = [
    {
      key: "role_names",
      label: "Role",
      type: "select",
      options: roles.map(role => ({ value: role.role_name, label: role.role_name })),
    },
    {
      key: "project_name",
      label: "Project",
      type: "select",
      options: projects.map(project => ({ value: project.project_name, label: project.project_name })),
    },
    {
      key: "employee_name",
      label: "Name",
      type: "text",
    },
    {
      key: "employee_email",
      label: "Email",
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

  return (
    <div className="space-y-6 p-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage team members and their roles</p>
        </div>
        <AddEmployeeDrawer
          onEmployeeCreated={async () => {
            const fresh = await getEmployees();
            setEmployees(fresh);
          }}
        />
      </div>

      <DataTable<Employee>
        columns={columns}
        data={employees}
        enableSearch={true}
        enableFilters={true}
        filterFields={filterFields}
        searchableFields={["employee_id", "employee_name", "employee_email", "employee_contact_number"] as (keyof Employee)[]}
        pageSize={10}
      />

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
