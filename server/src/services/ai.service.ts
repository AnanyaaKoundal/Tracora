const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
const TIMEOUT_MS = 60_000;

export class AiServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function callAiService(
  path: string,
  body: Record<string, unknown>,
  timeoutMs: number = TIMEOUT_MS,
  authToken?: string
) {
  let response: Response;
  // The caller's JWT is forwarded on chat turns so the AI service can act on that
  // user's behalf when it reads data back from Express. It is used for nothing else.
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = authToken;
  try {
    response = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new AiServiceError("AI service is unreachable", 503);
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new AiServiceError(`AI service error: ${detail}`, response.status);
  }

  return response.json();
}

export const findDuplicates = (description: string, company_id: string) =>
  callAiService("/bugs/duplicates", { description, company_id });

export const suggestTitle = (description: string) =>
  callAiService("/bugs/suggest-title", { description });

// The agent can take several LLM round trips, so it gets its own budget. Still well
// under the 60s ceiling most proxies impose -- this is a local-demo timeout, and a
// real deployment needs a job queue rather than a long request.
const AGENT_TIMEOUT_MS = 180_000;

export type AgentHistoryTurn = {
  role: "user" | "assistant";
  content: string;
};

export const chatTurn = (
  message: string,
  company_id: string,
  employee_id?: string,
  context?: Record<string, unknown> | null,
  history?: AgentHistoryTurn[],
  contextChanged?: boolean,
  authToken?: string
) =>
  callAiService(
    "/agent/turn",
    {
      message,
      company_id,
      user_id: employee_id,
      context: context ?? null,
      history: history ?? [],
      context_changed: contextChanged ?? false,
    },
    AGENT_TIMEOUT_MS,
    authToken
  );
