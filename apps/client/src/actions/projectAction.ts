import z from "zod";
import { createRoleSchema, roleListSchema, roleSchema } from "@/schemas/admin.schema";
import { createProjectSchema } from "@/schemas/project.schema";
import { fetchRolesforAdmin, createRoleService, updateRoleService, deleteRoleService } from "@/services/adminService";
import { fetchAllProjectsService, createProjectService, updateProjectService, deleteProjectService } from "@/services/projectService";

export async function getAllProjects() {

  const data = await fetchAllProjectsService();
  console.log("Data: ", data);
  if (!data.success) {
    console.error("Failed to fetch roles", data.error);
    return [];
  }

  return data.data;
}


export async function createProject(data: z.Infer<typeof createProjectSchema>) {
  const parsed = createRoleSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: "Invalid data" };
  }

  try {
    const project = await createProjectService(data);
    return { success: true, data: project };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create role" };
  }
}


export async function updateProject(id: string, data: unknown) {
  const parsed = createRoleSchema.safeParse(data); // reuse schema since same shape
  if (!parsed.success) {
    return { success: false, message: "Invalid data" };
  }

  try {
    const updated = await updateProjectService(id, parsed.data);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update role" };
  }
}

// ✅ Delete role
export async function deleteProject(id: string) {
  try {
    await deleteProjectService(id);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete role" };
  }
}