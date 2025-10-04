import { z } from "zod";

export enum BugPriority {
  Critical = 1,
  High,
  Medium,
  Low,
  Trivial,
}

// ✅ Schema for creating a new bug
export const createBugSchema = z.object({
  bug_name: z.string().min(1, "Bug name is required"),
  bug_description: z.string().min(1, "Bug description is required"),
  bug_status: z.enum(["Open", "Under Review", "Closed", "Fixed"]).optional(),
  assigned_to: z.string().optional(),
  comments: z.array(z.string()).optional(),
  bug_priority: z.nativeEnum(BugPriority).default(BugPriority.Medium),
});

// ✅ General schema for a bug (used for type inference)
export const bugSchema = z.object({
  bug_id: z.string().min(1, "Bug ID is required"),
  bug_name: z.string(),
  bug_description: z.string(),
  bug_status: z.enum(["Open", "Under Review", "Closed", "Fixed"]),
  reported_by: z.string(),
  assigned_to: z.string().optional(),
  bug_priority: z.nativeEnum(BugPriority),
  comments: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// ✅ Type inference
export type CreateBugInput = z.infer<typeof createBugSchema>;
export type Bug = z.infer<typeof bugSchema>;
