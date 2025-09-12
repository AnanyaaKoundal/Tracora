import { Request, Response } from "express";
import * as bugService from "../../services/bug.service";
import asyncHandler from "../../utils/asyncHandler";

export const createBug = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const newBug = await bugService.createBug(req.body, user);
    res.status(201).json({
        success: true,
        message: "Bug created successfully",
        data: newBug,
    });
});

export const getAllBugs = asyncHandler(async (_req: Request, res: Response) => {
    const bug = await bugService.getAllBugs();
    res.status(200).json({
        success: true,
        message: "Bugs fetched successfully",
        data: bug,
    });
});

export const getbugById = asyncHandler(async (req: Request, res: Response) => {
    const bug = await bugService.getBugById(req.params.bug_id);
    res.status(200).json({
        success: true,
        message: "Bug fetched successfully",
        data: bug,
    });
});


export const editBug = asyncHandler(async (req: Request, res: Response) => {
    const updatedBug = await bugService.editBug(req.params.bug_id, req.body);
    res.status(200).json({
      success: true,
      message: "Bug updated successfully",
      data: updatedBug,
    });
  });
  
  export const deleteBugById = asyncHandler(async (req: Request, res: Response) => {
    const deletedBug = await bugService.deleteBugById(req.params.bug_id);
    res.status(200).json({
      success: true,
      message: "Bug deleted successfully",
      data: deletedBug,
    });
  });

  export const getBugsById = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const bugs = await bugService.getBugs(user);
    res.status(200).json({
      success: true,
      message: "Bugs fetched successfully",
      data: bugs,
    });
  });