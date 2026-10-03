import Conversation from "@/models/conversation.model";
import ApiError from "../utils/ApiError";
import { generateConversationId } from "./id.service";

// Matches the ai-service HistoryTurn cap (max_length=4). Sending more would be
// rejected at the model boundary, so the trim happens here where it is cheap.
const MAX_HISTORY_MESSAGES = 4;
const MAX_TITLE_CHARS = 60;
const MAX_PREVIEW_CHARS = 80;

const deriveTitle = (message: string) => {
  const clean = message.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_TITLE_CHARS) return clean;
  return `${clean.slice(0, MAX_TITLE_CHARS - 1).trimEnd()}\u2026`;
};

const previewOf = (conversation: any) => {
  const last = conversation.messages?.[conversation.messages.length - 1];
  return typeof last?.content === "string" ? last.content.slice(0, MAX_PREVIEW_CHARS) : "";
};

export const toClient = (conversation: any) => ({
  conversation_id: conversation.conversation_id,
  title: conversation.title,
  kind: conversation.kind,
  updated_at: conversation.updatedAt,
  messages: (conversation.messages ?? []).map((m: any) => ({
    role: m.role,
    content: m.content,
    steps: m.steps ?? [],
    citations: m.citations ?? [],
  })),
});

export const createConversation = async (data: {
  company_id: string;
  employee_id: string;
  title: string;
  kind?: string | null;
}) => {
  return Conversation.create({
    conversation_id: generateConversationId(),
    company_id: data.company_id,
    employee_id: data.employee_id,
    title: deriveTitle(data.title),
    kind: data.kind ?? "general",
    messages: [],
  });
};

export const listConversations = async (company_id: string, employee_id: string) => {
  const conversations = await Conversation.find({ company_id, employee_id }).sort({
    updatedAt: -1,
  });

  return conversations.map((conversation) => ({
    conversation_id: conversation.conversation_id,
    title: conversation.title,
    kind: conversation.kind,
    updated_at: conversation.updatedAt,
    message_count: conversation.messages.length,
    preview: previewOf(conversation),
  }));
};

// Ownership is part of the query, not a check afterwards, so a guessed id from
// another employee or tenant simply does not resolve.
export const getConversation = async (
  conversation_id: string,
  company_id: string,
  employee_id: string
) => {
  const conversation = await Conversation.findOne({
    conversation_id,
    company_id,
    employee_id,
  });
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }
  return conversation;
};

export const appendExchange = async (
  conversation: any,
  userContent: string,
  assistantContent: string,
  steps: string[],
  contextId?: string | null,
  citations?: Array<{ type: string; id: string; title?: string | null }>
) => {
  conversation.messages.push({ role: "user", content: userContent, context_id: contextId ?? null });
  conversation.messages.push({
    role: "assistant",
    content: assistantContent,
    steps: steps ?? [],
    citations: citations ?? [],
  });
  await conversation.save();
};

// The page context of the employee's previous turn, for detecting navigation. Returns
// the last user message's context even when it is null, so moving from a plain page
// onto a bug page also reads as a change.
export const lastUserContextId = (conversation: any): string | null => {
  const messages = conversation.messages ?? [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") {
      return messages[i].context_id ?? null;
    }
  }
  return null;
};

export const deleteConversation = async (
  conversation_id: string,
  company_id: string,
  employee_id: string
) => {
  const deleted = await Conversation.findOneAndDelete({
    conversation_id,
    company_id,
    employee_id,
  });
  if (!deleted) {
    throw new ApiError(404, "Conversation not found");
  }
  return deleted;
};

// Earlier turns for the model are read from the stored conversation rather than
// trusted from the client. That keeps one source of truth and means a reopened
// conversation still has its context.
export const historyForModel = (conversation: any) =>
  (conversation.messages ?? [])
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m: any) => ({ role: m.role, content: m.content }));
