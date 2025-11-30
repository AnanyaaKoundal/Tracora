import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import ApiResponse from "@/utils/ApiResponse";
import Notification from "@/models/notification.model";

export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
    const id = (req as any).user.employee_id;
    const { title, participants, reference_id, reference_name, readStatus} = req.body;

    await Notification.create({
        title,
        participants,
        reference_id, 
        reference_name, 
        readStatus
    });

    res.status(201).json(new ApiResponse(201, "Employee created"));
});