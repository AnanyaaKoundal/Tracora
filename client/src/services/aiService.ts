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
