import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import AdminStatsService from "@/services/dashboard.service";
import ApiError from "@/utils/ApiError"; // assuming you have this class

export const getAdminStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const stats = await AdminStatsService.getCircleStats();

  if (!stats) {
    return res.json(new ApiError(500, "Failed to fetch admin stats"));
  }

  res.status(200).json({
    success: true,
    message: "Admin stats fetched successfully",
    stats,
  });
});
