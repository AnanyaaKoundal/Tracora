import { createEmployeeSchema, createRoleSchema, employeeSchema, roleListSchema, roleSchema } from "@/schemas/admin.schema";
import { fetchEmployees, createEmployeeService, updateEmployeeService, deleteEmployeeService } from "@/services/adminService";
import z from "zod";

export async function getEmployees() {

  const data = await fetchEmployees();
  console.log("Data: ", data);
  // const parsed = roleListSchema.safeParse(data);
  if (!data.success) {
    console.error("Failed to fetch roles", data.error);
    return [];
  }

  return data.data;
}


export async function createEmployee(data: z.Infer<typeof createEmployeeSchema>) {

  try {
    const role = await createEmployeeService(data);
    return { success: true, data: role };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to create role" };
  }
}


export async function updateEmployee(id: string, data: z.Infer<typeof employeeSchema>) {
  try {
    const updated = await updateEmployeeService(id, data);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update role" };
  }
}

export async function deleteEmployee(id: string) {
  try {
    await deleteEmployeeService(id);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to delete role" };
  }
}