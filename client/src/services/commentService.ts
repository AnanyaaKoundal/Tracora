let URL = "http://localhost:5000";

import { CreateCommentSchema } from "@/schemas/comment.schema";

export const postCommentService = async (data: CreateCommentSchema) => {
    const res = await fetch(`${URL}/comment/postComment`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error creating comment");

    return res.json();
};

export const fetchCommentsService = async (bugId: string) => {
  const res = await fetch(`${URL}/comment/fetchComments`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ bugId }),   // <-- Sending bugId here
  });

  if (res.status === 403) {
    return { error: "Forbidden", status: 403, success: false };
  }

  if (!res.ok) {
    throw new Error("Failed to fetch comments");
  }

  return res.json();
};
