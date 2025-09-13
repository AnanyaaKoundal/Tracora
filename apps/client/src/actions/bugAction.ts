import z from "zod";
import { createBugSchema, bugSchema, CreateBugInput, Bug } from "@/schemas/bug.schema";
import { fetchAllBugsService, createBugService, deleteBugService, fetchBugByIdService, updateBugService} from "@/services/bugService";

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
    return { success: false, message: err.message || "Failed to delete bug" };
  }
}

export async function getBugById(id: string){
  try {
    const bug = await fetchBugByIdService(id);
    return { success: true, data: bug.data };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to fetch bug" };
  }
}

export async function updateBug(data : Bug) {
  try {
    await updateBugService(data);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update bug" };
  }
}