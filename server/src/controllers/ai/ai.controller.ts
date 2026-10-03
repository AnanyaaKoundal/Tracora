import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import ApiError from "../../utils/ApiError";
import { findDuplicates, suggestTitle, chatTurn, AiServiceError } from "../../services/ai.service";
import * as conversationService from "../../services/conversation.service";

const requireDescription = (req: Request): string => {
    const { description } = req.body;
    if (!description || typeof description !== "string" || !description.trim()) {
      throw new ApiError(400, "Description is required");
    }
    return description.trim();
};

export const getDuplicates = asyncHandler(async (req: Request, res: Response) => {
    const description = requireDescription(req);

    // company_id always comes from the verified token, never from the client
    const company_id = (req as any).user.company_id;

    try {
      const result = await findDuplicates(description, company_id);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof AiServiceError) {
        throw new ApiError(err.status, err.message);
      }
      throw err;
    }
});

export const getTitleSuggestion = asyncHandler(async (req: Request, res: Response) => {
    const description = requireDescription(req);

    try {
      const result = await suggestTitle(description);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof AiServiceError) {
        throw new ApiError(err.status, err.message);
      }
      throw err;
    }
});

// Page context is a draft being written, a bug being viewed, or any other page the
// user is on. Anything else is dropped rather than forwarded, so the model never
// receives an unexpected shape.
const normalizeContext = (raw: unknown): Record<string, unknown> | null => {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object") {
    throw new ApiError(400, "Context must be an object");
  }
  const { kind, label, data } = raw as Record<string, unknown>;
  if (kind !== "draft" && kind !== "bug" && kind !== "page") return null;
  // `data` must be a plain object. A non-object here used to reach the agent and
  // crash it, because it assumes a dict when it reads title/description.
  const safeData =
    data !== null && typeof data === "object" && !Array.isArray(data) ? data : {};
  return { kind, label: label ?? null, data: safeData };
};

const kindFromContext = (context: Record<string, unknown> | null): string => {
  if (context?.kind === "draft") return "draft";
  if (context?.kind === "bug") return "bug";
  return "general";
};

// The id that identifies which page the user is on, used to detect navigation between
// turns. Only bug pages carry an id; drafts and generic pages do not.
const contextKey = (context: Record<string, unknown> | null): string | null => {
  if (context?.kind !== "bug") return null;
  const label = context.label;
  return typeof label === "string" && label.trim() ? label.trim() : null;
};

export const chat = asyncHandler(async (req: Request, res: Response) => {
    const { message, context, conversation_id } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new ApiError(400, "Message is required");
    }

    // Identity is taken from the verified token. The client never sends it, and the
    // agent is never allowed to choose a tenant.
    const user = (req as any).user;

    // The AI service reads data back through Express on this user's behalf, so it needs
    // the credential this request carried. Accept either transport the client used.
    const authToken =
      req.headers.authorization ||
      (req.cookies?.token ? `Bearer ${req.cookies.token}` : undefined);

    if (conversation_id !== undefined && conversation_id !== null && conversation_id !== "") {
      if (typeof conversation_id !== "string") {
        throw new ApiError(400, "conversation_id must be a string");
      }
    }

    const normalizedContext = normalizeContext(context);

    // A turn either continues the conversation the client is on, or starts a new one.
    // Loading via the service scopes to tenant and employee, so a forged id 404s.
    const conversation =
      typeof conversation_id === "string" && conversation_id
        ? await conversationService.getConversation(
            conversation_id,
            user.company_id,
            user.employee_id
          )
        : await conversationService.createConversation({
            company_id: user.company_id,
            employee_id: user.employee_id,
            title: message.trim(),
            kind: kindFromContext(normalizedContext),
          });

    // History comes from the stored conversation, never from the client payload.
    const history = conversationService.historyForModel(conversation);

    // A change of page since the last turn means the newly opened bug is what a bare
    // "it" refers to. Compared against what was stored, not what the client claims.
    const activeContextId = contextKey(normalizedContext);
    const previousContextId = conversationService.lastUserContextId(conversation);
    const contextChanged = activeContextId !== null && activeContextId !== previousContextId;

    try {
      const result = await chatTurn(
        message.trim(),
        user.company_id,
        user.employee_id,
        normalizedContext,
        history,
        contextChanged,
        authToken
      );

      await conversationService.appendExchange(
        conversation,
        message.trim(),
        result.reply,
        result.steps ?? [],
        activeContextId
      );

      res.status(200).json({
        conversation_id: conversation.conversation_id,
        reply: result.reply,
        steps: result.steps ?? [],
      });
    } catch (err) {
      if (err instanceof AiServiceError) {
        throw new ApiError(err.status, err.message);
      }
      throw err;
    }
});

export const listConversations = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const conversations = await conversationService.listConversations(
      user.company_id,
      user.employee_id
    );
    res.status(200).json({
      success: true,
      message: "Conversations fetched successfully",
      data: conversations,
    });
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const conversation = await conversationService.getConversation(
      req.params.conversation_id,
      user.company_id,
      user.employee_id
    );
    res.status(200).json({
      success: true,
      message: "Conversation fetched successfully",
      data: conversationService.toClient(conversation),
    });
});

export const deleteConversation = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    await conversationService.deleteConversation(
      req.params.conversation_id,
      user.company_id,
      user.employee_id
    );
    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
});
