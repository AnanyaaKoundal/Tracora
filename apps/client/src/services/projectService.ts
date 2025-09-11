import z from "zod";
import { createProjectSchema, projectSchema } from "@/schemas/project.schema";

let URL = "http://localhost:5000";

export const createProjectService = async (data: z.Infer<typeof createProjectSchema>) => {
    const res = await fetch(`${URL}/admin/createProject`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error creating role");

    return res.json();
};

export const fetchAllProjectsService = async () => {
    const res = await fetch(`${URL}/admin/get-projects`, {
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
        throw new Error("Failed to fetch employees");
      }
    
      return res.json();
}

export const updateProjectService = async (id: string, data: z.Infer<typeof projectSchema>) => {
  const res = await fetch(`${URL}/admin/project/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error updating role");

  return res.json();
};

export const deleteProjectService = async (id: string) => {
  const res = await fetch(`${URL}/admin/project/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Error deleting role");

  return res.json();
};

export const fetchProjectsService = async () => {
  const res = await fetch(`${URL}/projects/get-projects`, {
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
      throw new Error("Failed to fetch employees");
    }
  
    return res.json();
}