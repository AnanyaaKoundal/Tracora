import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import  { AdminStatsService, getEmployeeForTable } from "@/services/dashboard.service";
import ApiError from "@/utils/ApiError"; // assuming you have this class
import ApiResponse from "@/utils/ApiResponse";

export const getAdminStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const stats = await AdminStatsService();

  if (!stats) {
    return res.json(new ApiError(500, "Failed to fetch admin stats"));
  }

  res.status(200).json({
    success: true,
    message: "Admin stats fetched successfully",
    stats,
  });
});

export const getEmployeeList = asyncHandler(async(req: Request, res: Response): Promise<any> => {
  try{
    const employees = await getEmployeeForTable();
    if(!employees){
      return res.json(new ApiError(500, "No employees found"));
    }
    return res.json(new ApiResponse(200, "Employee table fetched", employees));
  }catch(error){
    console.log(error);
    return res.json(new ApiError(500, "Failed to fetch employee table"));
  }
})
