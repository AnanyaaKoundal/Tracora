import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import ApiResponse from "@/utils/ApiResponse";
import ApiError from "@/utils/ApiError";
import { createCommentService, fetchCommentsService } from "@/services/comment.service";

export const createComment = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    console.log(req.body);
    const newBug = await createCommentService(req.body, user);
    res.status(201).json(new ApiResponse(200, "newBug", "Comment created successfully"));
});

export const fetchComments = asyncHandler(async (req: Request, res: Response) => {
    const {bugId} = req.body;
    const bug = await fetchCommentsService(bugId);
    res.status(200).json({
        success: true,
        message: "Bugs fetched successfully",
        data: bug,
    });
});