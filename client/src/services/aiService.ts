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

export type AssistantContext = {
  kind: "draft" | "bug";
  label: string;
  data: { title?: string; description?: string };
};

export type AgentReply = {
  reply: string;
  steps: string[];
};

export type AgentHistoryTurn = {
  role: "user" | "assistant";
  content: string;
};

// Sent with the request, never stored server-side. The server caps this at 4 turns;
// trimming here keeps the payload small and the behaviour obvious.
export const MAX_HISTORY_TURNS = 4;

export const chatService = async (
  message: string,
  context?: AssistantContext | null,
  history: AgentHistoryTurn[] = []
): Promise<AgentReply> => {
  const res = await fetch(`${URL}/ai/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      context: context ?? null,
      history: history.slice(-MAX_HISTORY_TURNS),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Assistant request failed");
  }

  return res.json() as Promise<AgentReply>;
};
