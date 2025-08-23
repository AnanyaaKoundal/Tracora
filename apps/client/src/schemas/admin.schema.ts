import { z } from "zod";

export const createRoleSchema = z.object({
    role_name: z.string().min(2, "Role name must be at least 2 characters"),
  });
  
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
  
  // ✅ Schema for role object as returned from backend
  export const roleSchema = z.object({
    role_id: z.string(),
    role_name: z.string(),
    createdAt: z.string(),
  });
  
  export type Role = z.infer<typeof roleSchema>;
  export const roleListSchema = z.array(roleSchema);  

export const employeeSchema = z.object({
    user_name: z.string().nonempty("Username is required"),
    email: z.string().email("Invalid email format"),
    contact_no: z.string().nonempty("Contact number is required"),
    roleId: z.array(z.string()), 
    project: z.string().optional(), 
})