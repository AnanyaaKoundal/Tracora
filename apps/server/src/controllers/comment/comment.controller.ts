import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import ApiResponse from "@/utils/ApiResponse";
import ApiError from "@/utils/ApiError";
import { createCommentService, fetchCommentsService } from "@/services/comment.service";
import { kafkaProducer } from "@/config/kafka/kafka_producer";
import { broadcastNewComment } from "../../../index";

export const createComment = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    console.log(req.body);

    const newComment = await createCommentService(req.body, user);

    await kafkaProducer.send("comment-topic", {
        newComment,
        action: "created",
        message: `${user.employeeId} commented on bug ${newComment.bug_id}`
    });

    broadcastNewComment(newComment.bug_id, newComment);

    res.status(201).json(new ApiResponse(200, newComment, "Comment created successfully"));
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