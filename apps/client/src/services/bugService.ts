import z from "zod";
import { CreateBugInput, createBugSchema } from "@/schemas/bug.schema";

let URL = "http://localhost:5000";

export const createBugService = async (data: CreateBugInput) => {
    const res = await fetch(`${URL}/bug/create-bug`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error creating bug");

    return res.json();
};

export const fetchAllBugsService = async () => {
    const res = await fetch(`${URL}/bug/getAllbugs`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if(res.status === 403){
        return { error: "Forbidden", status: 403, success: false};
      }
    
      if (!res.ok) {
        throw new Error("Failed to fetch bugs");
      }
    
      return res.json();
}

export const deleteBugService = async (id: string) => {
  const res = await fetch(`${URL}/bug/delete/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Error deleting role");

  return res.json();
};