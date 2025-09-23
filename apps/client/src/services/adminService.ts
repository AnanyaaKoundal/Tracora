let URL = "http://localhost:5000";

import { createEmployeeSchema, employeeSchema } from "@/schemas/admin.schema";
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

export const getCompanyDetails = async () => {
  const res = await fetch(`${URL}/admin/getCompany`, {
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

  if(!res.ok){
    throw new Error("Failed to fetch company details");
  }

  return res.json();
}

export const fetchRolesforAdmin =  async () => {
  const res = await fetch(`${URL}/admin/getRoles`, {
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

  if(!res.ok){
    throw new Error("Failed to fetch roles");
  }

  return res.json();
}

export const createRoleService = async (data: { role_name: string }) => {
    const res = await fetch(`${URL}/admin/createRole`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error creating role");

    return res.json();
};

export const updateRoleService = async (id: string, data: { role_name: string }) => {
  const res = await fetch(`${URL}/admin/role/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error updating role");

  return res.json();
};

export const deleteRoleService = async (id: string) => {
  const res = await fetch(`${URL}/admin/role/${id}`, {
    credentials: "include",
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  console.log(res);
  if (!res.ok) throw new Error("Error deleting role");

  return res.json();
};


export const fetchEmployees =  async () => {
  const res = await fetch(`${URL}/admin/getAllEmployees`, {
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

export const createEmployeeService = async (data: z.Infer<typeof createEmployeeSchema>) => {
    const res = await fetch(`${URL}/admin/createEmployee`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error creating role");

    return res.json();
};

export const updateEmployeeService = async (id: string, data: z.Infer<typeof employeeSchema>) => {
  const res = await fetch(`${URL}/admin/employee/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  console.log("Res: ", res);
  if (!res.ok) throw new Error("Error updating employee");

  return res.json();
};

export const deleteEmployeeService = async (id: string) => {
  const res = await fetch(`${URL}/admin/employee/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error("Error deleting role");

  return res.json();
};

export const editCompanyPhoneService = async(phone: string) => {
  const res = await fetch(`${URL}/admin/company/editPhone`, {
    method: "PUT",
    credentials: "include",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(phone)
  });
  return res.json();
}

export const editCompanyEmailService = async(email: string) => {
  const res = await fetch(`${URL}/admin/company/editEmail`, {
    method: "PUT",
    credentials: "include",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(email)
  });
  console.log(res);
  return res.json();
}

export const editCompanyPasswordService = async(data: any) => {
  const res = await fetch(`${URL}/admin/company/updatePassword`, {
    method: "PUT",
    credentials: "include",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(data)
  });
  console.log(res);
  // if(!res.ok) throw new Error("Error updating the email");
  return res.json();
}

export const fetchAdminStats =  async () => {
  const res = await fetch(`${URL}/admin/stats`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch admin stats");
  }

  return res.json();
}