"use client";

import { useState, useEffect } from "react";
import { DataTable, Column } from "@/components/Table/DataTable";
import {
  getEmployees,
  updateEmployee,
  deleteEmployee,
} from "@/actions/employeeAction";
import { AddEmployeeDrawer } from "@/components/AdminPanel/AddEmployee";
import { EditEmployeeDrawer } from "@/components/AdminPanel/EditEmployee";
import { DeleteEmployeeDialog } from "@/components/AdminPanel/DeleteEmployee";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Employee, Role, Project } from "@/schemas/admin.schema"; // ✅ make sure Role, Project are exported

// ⬇️ You’ll need APIs to fetch roles & projects too
import { getRoles } from "@/actions/rolesAction";
import { getProjects } from "@/actions/projectAction";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null
  );

  const columns: Column<Employee>[] = [
    { key: "_id", header: "ID"},
    { key: "user_name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "contact_no", header: "Contact No" },
    {
      key: "roleId",
      header: "Role",
      render: (row) => row.roleId?.role_name || "-",
    },
    {
      key: "projectId",
      header: "Project",
      render: (row) => row.projectId?.project_name || "-",
    },
    { key: "createdAt", header: "Created At" },
    { key: "modifiedAt", header: "Modified At" },
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

  useEffect(() => {
    async function fetchData() {
      const [employeesData, rolesData, projectsData] = await Promise.all([
        getEmployees(),
        getRoles(),
        getProjects(),
      ]);
      setEmployees(employeesData);
      setRoles(rolesData);
      setProjects(projectsData);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Employees</h1>
        <AddEmployeeDrawer
          onEmployeeCreated={async () => {
            const fresh = await getEmployees();
            setEmployees(fresh);
          }}
        />
      </div>

      <DataTable<Employee> columns={columns} data={employees} />

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

      {deletingEmployee && (
        <DeleteEmployeeDialog
          open={!!deletingEmployee}
          onOpenChange={(open: boolean) => {
            if (!open) setDeletingEmployee(null);
          }}
          employeeId={deletingEmployee._id}
          employeeEmail={deletingEmployee.email}
          onConfirm={async () => {
            const res = await deleteEmployee(deletingEmployee._id);
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
