let URL = "http://localhost:5000";

import { registerCompanySchema } from "@/schemas/register.schema";
import z from "zod";
  
export const registerCompanyService = async (values: z.Infer<typeof registerCompanySchema>) => {
  const response = await fetch(`${URL}/auth/registerCompany`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-Type": "application/json",
    },

    body: JSON.stringify(values),
  });

  const res = await response.json();
  return res;
};

export const verifyOtpAndCreateCompanyService =  async (values: z.Infer<typeof registerCompanySchema>) => {
  const response = await fetch(`${URL}/auth/company/verify`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-Type": "application/json",
    },

    body: JSON.stringify(values),
  });

  const res = await response.json();
  return res;
};


export const fetchRoles =  async () => {
  const res = await fetch(`${URL}/admin/roles`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch roles");
  }

  return res.json();
}

export const createRoleService = async (data: { role_name: string }) => {
    const res = await fetch(`${URL}/admin/createRole`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error creating role");

    return res.json();
};

export const updateRoleService = async (id: string, data: { role_name: string }) => {
  const res = await fetch(`${URL}/admin/role/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error updating role");

  return res.json();
};

export const deleteRoleService = async (id: string) => {
  const res = await fetch(`${URL}/admin/role/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Error deleting role");

  return res.json();
};


export const fetchEmployees =  async () => {
  const res = await fetch(`${URL}/admin/employees`, {
    method: "GET",
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

export const createEmployeeService = async (data: { role_name: string }) => {
    const res = await fetch(`${URL}/admin/createUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error creating role");

    return res.json();
};

export const updateEmployeeService = async (id: string, data: { role_name: string }) => {
  const res = await fetch(`${URL}/admin/user/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error updating role");

  return res.json();
};

export const deleteEmployeeService = async (id: string) => {
  const res = await fetch(`${URL}/admin/user/role/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Error deleting role");

  return res.json();
};
