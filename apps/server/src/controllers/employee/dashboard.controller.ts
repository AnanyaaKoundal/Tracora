import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import ApiError from "@/utils/ApiError"; // assuming you have this class
import { getDashboardData } from "@/services/dashboard.service"

export const getDashboardStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const id = (req as any).user.employee_id;
    const role = (req as any).user.role;
  const stats = await getDashboardData(id, role);

  if (!stats) {
    return res.json(new ApiError(500, "Failed to fetch admin stats"));
  }

  res.status(200).json({
    success: true,
    message: "Dashboard stats fetched successfully",
    stats,
  });
});