import z from "zod";
import { createBugSchema, bugSchema } from "@/schemas/bug.schema";
import { fetchAllBugsService, createBugService} from "@/services/bugService";

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