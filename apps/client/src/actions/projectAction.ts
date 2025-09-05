import { createRoleSchema, roleListSchema, roleSchema } from "@/schemas/admin.schema";
import { fetchRolesforAdmin, createRoleService, updateRoleService, deleteRoleService } from "@/services/adminService";

export async function getProjects() {

  const data = await fetchRolesforAdmin();
  console.log("Data: ", data);
  // const parsed = roleListSchema.safeParse(data);
  if (!data.success) {
    console.error("Failed to fetch roles", data.error);
    return [];
  }

  return data.data;
}


export async function createEmployee(data: unknown) {
  const parsed = createRoleSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "Invalid data" };
  }

  try {
    const role = await createRoleService(parsed.data);
    return { success: true, data: role };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create role" };
  }
}


export async function updateRole(id: string, data: unknown) {
  const parsed = createRoleSchema.safeParse(data); // reuse schema since same shape
  if (!parsed.success) {
    return { success: false, message: "Invalid data" };
  }

  try {
    const updated = await updateRoleService(id, parsed.data);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update role" };
  }
}

// ✅ Delete role
export async function deleteRole(id: string) {
  try {
    await deleteRoleService(id);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete role" };
  }
}