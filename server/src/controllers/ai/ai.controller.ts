import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import ApiError from "../../utils/ApiError";
import { findDuplicates, suggestTitle, chatTurn, AiServiceError } from "../../services/ai.service";

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

export const chat = asyncHandler(async (req: Request, res: Response) => {
    const { message, context } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new ApiError(400, "Message is required");
    }

    // Identity is taken from the verified token. The client never sends it, and the
    // agent is never allowed to choose a tenant.
    const user = (req as any).user;

    try {
      const result = await chatTurn(
        message.trim(),
        user.company_id,
        user.employee_id,
        context ?? null
      );
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof AiServiceError) {
        throw new ApiError(err.status, err.message);
      }
      throw err;
    }
});
