import z from "zod";
import { createProjectSchema } from "@/schemas/project.schema";

let URL = "http://localhost:5000";

export const createProjectService = async (data: z.Infer<typeof createProjectSchema>) => {
    const res = await fetch(`${URL}/projects/createProject`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error creating role");

    return res.json();
};

export const fetchAllProjectsService = async () => {
    const res = await fetch(`${URL}/projects/get-projects`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
    
      if (!res.ok) {
        throw new Error("Failed to fetch employees");
      }
    
      return res.json();
}

export const updateProjectService = async (id: string, data: { role_name: string }) => {
  const res = await fetch(`${URL}/admin/employee/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error updating role");

  return res.json();
};

export const deleteProjectService = async (id: string) => {
  const res = await fetch(`${URL}/admin/employee/role/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Error deleting role");

  return res.json();
};
