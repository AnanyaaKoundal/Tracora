import { z } from "zod";

export const createRoleSchema = z.object({
    role_name: z.string().min(2, "Role name must be at least 2 characters"),
  });
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const roleSchema = z.object({
    role_id: z.string(),
    role_name: z.string(),
    createdAt: z.string(),
});
export type Role = z.infer<typeof roleSchema>;
export const roleListSchema = z.array(roleSchema);  

export const createEmployeeSchema = z.object({
  user_name: z.string().min(1, "Employee name is required"),
  email: z.email("Invalid email"),
  contact_no: z.string().min(10, "Contact number must be at least 10 digits"),
  roleId: z.string().min(1, "Role is required"),   // 👈 single string
  projectId: z.string().min(1, "Project is required"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const employeeSchema = z.object({
  _id: z.string(),
  user_name: z.string().min(1, "User name is required"),
  email: z.email("Invalid email address"),
  contact_no: z
    .string()
    .min(7, "Contact number must be at least 7 digits")
    .max(15, "Contact number too long"),
    roleId: z.object({
      _id: z.string(),
      role_name: z.string(),
    }),
    projectId: z.object({
      _id: z.string(),
      project_name: z.string(),
    }),
  createdAt: z.string(),
  modifiedAt: z.string()
});
export type Employee = z.infer<typeof employeeSchema>;
export const employeeListSchema = z.array(employeeSchema);

export const createProjectSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Description is required"),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().optional(),
  status: z.enum(["Active", "Completed", "Inactive"]).optional(),
  team_members: z.array(z.string()).optional(),
  created_by: z.string().min(1, "Creator is required"),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const projectSchema = z.object({
  project_id: z.string(),
  project_name: z.string(),
  description: z.string(),
  start_date: z.coerce.date(),   // coerce allows string -> Date
  end_date: z.coerce.date().optional(),
  status: z.enum(["Active", "Completed", "Inactive"]).default("Active"),
  team_members: z.array(z.string()),   // will hold User IDs
  created_by: z.string(),              // user id
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type Project = z.infer<typeof projectSchema>;
export const projectListSchema = z.array(projectSchema);