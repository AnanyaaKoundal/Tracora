import { z } from "zod";

export const createProjectSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  project_description: z.string().min(1, "Project description is required"),
  project_start_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
  project_end_date: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid end date"),
  project_status: z.enum(["Upcoming","Active", "Completed", "Inactive", "Overdue"]).optional(),
});


export const projectSchema = z.object({
  project_id: z.string().min(1, "Project ID is required"),
  project_name: z.string().min(1, "Project name is required").optional(),
  project_description: z.string().optional(),
  project_start_date: z.string(),
  project_end_date: z.string().optional(),
  project_status: z.enum(["Active", "Completed", "Inactive"]).optional(),
  created_by: z.string().min(1, "Creator (employee ID) is required"),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type Project = z.infer<typeof projectSchema>;
