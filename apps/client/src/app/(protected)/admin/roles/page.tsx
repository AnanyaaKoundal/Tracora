"use client";

import { useState, useEffect } from "react";
import { DataTable, Column } from "@/components/Table/DataTable";
import { getRoles } from "@/actions/rolesAction";
import { AddRoleDrawer } from "@/components/AdminPanel/roles/AddRole";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DeleteRoleDialog } from "@/components/AdminPanel/roles/DeleteRole";
import { EditRoleDrawer } from "@/components/AdminPanel/roles/EditRole";
import { updateRole, deleteRole } from "@/actions/rolesAction";

type Role = {
  role_id: string;
  role_name: string;
  createdAt: string;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const columns: Column<Role>[] = [
    { key: "role_id", header: "ID" },
    { key: "role_name", header: "Role Name" },
    { key: "createdAt", header: "Created At" },
    {
      key: "actions",
      header: <div className="text-right">Actions</div>,
      render: (row: Role) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingRole(row)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeletingRole(row)}>
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
      const data = await getRoles();
      setRoles(data);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Roles</h1>
        <AddRoleDrawer
          onRoleCreated={async () => {
            const fresh = await getRoles();
            setRoles(fresh);
          }}
        />

      </div>

      <DataTable<Role> columns={columns} data={roles} />

      {editingRole && (
        <EditRoleDrawer
          open={!!editingRole}
          onOpenChange={(open) => !open && setEditingRole(null)}
          role={editingRole}
          onSave={async (data) => {
            const res = await updateRole(editingRole!.role_id, data);
            if (res.success) {
              // Refresh list
              const fresh = await getRoles();
              setRoles(fresh);
              setEditingRole(null);
            }
            return res; 
          }}
        />
      )}

      {deletingRole && (
        <DeleteRoleDialog
          open={!!deletingRole}
          onOpenChange={(open) => !open && setDeletingRole(null)}
          roleName={deletingRole?.role_name || ""}
          onConfirm={async () => {
            const res = await deleteRole(deletingRole!.role_id);
            if (res.success) {
              // Refresh list
              const fresh = await getRoles();
              setRoles(fresh);
              setDeletingRole(null);
            }
            return res;
          }}
        />
      )}

    </div>
  );
}
