import z from "zod";
import { createProjectSchema, projectSchema } from "@/schemas/project.schema";
import { fetchAllProjectsService, createProjectService, updateProjectService, deleteProjectService, fetchProjectsService } from "@/services/projectService";

export async function getAllProjects() {

  const data = await fetchAllProjectsService();
  console.log("Data: ", data);
  if (data.status === 403) {
    window.location.href = "/forbidden"; 
  return;
}
  if (!data.success) {
    console.error("Failed to fetch roles", data.error);
    return [];
  }

  return data.data;
}

export async function createProject(data: z.Infer<typeof createProjectSchema>) {

  try {
    const project = await createProjectService(data);
    return { success: true, data: project };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create project" };
  }
}


export async function updateProject(id: string, data: z.Infer<typeof projectSchema>) {
  console.log("Data: ", data);
  try {
    const updated = await updateProjectService(id, data);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update role" };
  }
}

export async function deleteProject(id: string) {
  try {
    await deleteProjectService(id);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete role" };
  }
}

export async function getProjects() {

  const data = await fetchProjectsService();

  if (!data.success) {
    console.error("Failed to fetch roles", data.error);
    return [];
  }

  return data.data;
}