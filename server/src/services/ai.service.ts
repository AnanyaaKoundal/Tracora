const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
const TIMEOUT_MS = 60_000;

export class AiServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function callAiService(path: string, body: Record<string, unknown>) {
  let response: Response;
  try {
    response = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
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
