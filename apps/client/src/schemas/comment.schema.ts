import { z } from "zod";

export const Comment = z.object({
  bug_id: z.string().min(1, "Bug ID is required"),

  message: z.string().min(1, "Message is required"),

  attachments: z
    .array(
      z.object({
        file_url: z.string().optional(),
        file_name: z.string().optional(),
        file_type: z.string().optional(),
      })
    )
    .optional(),

  isDeleted: z.boolean().optional(),   // default: false
  isEdited: z.boolean().optional(),    // default: false

  taggedUsers: z.array(z.string()).optional(),

  isReplyTo: z.string().optional(), // Comment ID (nullable in logic)
});

export type CreateCommentSchema = z.infer<typeof Comment>;
