import z from "zod";
import { createBugSchema, bugSchema, CreateBugInput } from "@/schemas/bug.schema";
import { fetchAllBugsService, createBugService, deleteBugService} from "@/services/bugService";

export async function getAllBugs() {

  const data = await fetchAllBugsService();
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

export async function createBug(data: CreateBugInput){
  try {
      const bug = await createBugService(data);
      return { success: true, data: bug };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to create bug" };
    }
}

export async function deleteBug(id: string) {
  try {
    await deleteBugService(id);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete role" };
  }
}