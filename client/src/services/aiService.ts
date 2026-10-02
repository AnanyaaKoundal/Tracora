let URL = "http://localhost:5000";

export type DuplicateMatch = {
  bug_id: string;
  title: string | null;
  score: number;
};

export const checkDuplicatesService = async (description: string) => {
  const res = await fetch(`${URL}/ai/duplicates`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) throw new Error("Failed to check duplicates");

  return res.json() as Promise<{ matches: DuplicateMatch[] }>;
};

export const suggestTitleService = async (description: string) => {
  const res = await fetch(`${URL}/ai/suggest-title`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });

  if (!res.ok) throw new Error("Failed to get title suggestion");

  return res.json() as Promise<{ title: string }>;
};

// The page the user is on when they ask. A bug they are viewing, a draft they are
// writing, or any other page ("page"). The server whitelists the shape before
// forwarding it to the model.
export type AssistantContext = {
  kind: "draft" | "bug" | "page";
  label: string;
  data: { title?: string; description?: string };
};

export type AgentReply = {
  conversation_id: string;
  reply: string;
  steps: string[];
};

export type ConversationSummary = {
  conversation_id: string;
  title: string;
  kind: string;
  updated_at: string;
  message_count: number;
  preview: string;
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  steps: string[];
};

export type ConversationDetail = {
  conversation_id: string;
  title: string;
  kind: string;
  updated_at: string;
  messages: ConversationMessage[];
};

// History is no longer sent by the client: the server reads it back from the stored
// conversation, which is the single source of truth and survives a page refresh.
export const chatService = async (
  message: string,
  context?: AssistantContext | null,
  conversationId?: string | null
): Promise<AgentReply> => {
  const res = await fetch(`${URL}/ai/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      context: context ?? null,
      conversation_id: conversationId ?? null,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Assistant request failed");
  }

  return res.json() as Promise<AgentReply>;
};

export const listConversationsService = async () => {
  const res = await fetch(`${URL}/ai/conversations`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to load conversations");

  const body = (await res.json()) as { data: ConversationSummary[] };
  return body.data;
};

export const getConversationService = async (conversationId: string) => {
  const res = await fetch(`${URL}/ai/conversations/${conversationId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to load conversation");

  const body = (await res.json()) as { data: ConversationDetail };
  return body.data;
};

export const deleteConversationService = async (conversationId: string) => {
  const res = await fetch(`${URL}/ai/conversations/${conversationId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to delete conversation");
};
