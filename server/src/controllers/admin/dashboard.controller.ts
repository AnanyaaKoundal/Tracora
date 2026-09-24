import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import  { AdminStatsService, getBugsforDashboard, getBugTrends, getEmployeeForTable, getProjectsForTable } from "@/services/dashboard.service";
import ApiError from "@/utils/ApiError"; // assuming you have this class
import ApiResponse from "@/utils/ApiResponse";

export const getAdminStats = asyncHandler(async (req: Request, res: Response): Promise<any> => {
  const company_id = (req as any).user.company_id;
  const stats = await AdminStatsService(company_id);

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
    const company_id = (req as any).user.company_id;
    const employees = await getEmployeeForTable(company_id);
    if(!employees){
      return res.json(new ApiError(500, "No employees found"));
    }
    return res.json(new ApiResponse(200, "Employee table fetched", employees));
  }catch(error){
    console.log(error);
    return res.json(new ApiError(500, "Failed to fetch employee table"));
  }
})


export const getProjectList = asyncHandler(async(req: Request, res: Response): Promise<any> => {
  try{
    const company_id = (req as any).user.company_id;
    const projects = await getProjectsForTable(company_id);
    if(!projects){
      return res.json(new ApiError(500, "No projects found"));
    }
    return res.json(new ApiResponse(200, "Project table fetched", projects));
  }catch(error){
    console.log(error);
    return res.json(new ApiError(500, "Failed to fetch project table"));
  }
})

export const getBugList =  asyncHandler(async(req: Request, res: Response): Promise<any> => {
  try{
    const company_id = (req as any).user.company_id;
    const projects = await getBugsforDashboard(company_id);
    if(!projects){
      return res.json(new ApiError(500, "No  bugs found"));
    }
    return res.json(new ApiResponse(200, "Bugs table fetched", projects));
  }catch(error){
    console.log(error);
    return res.json(new ApiError(500, "Failed to fetch bug table"));
  }
})

export const getBugTrendsController  =  asyncHandler(async(req: Request, res: Response): Promise<any> => {
  try{
    const company_id = (req as any).user.company_id;
    const projects = await getBugTrends(company_id);
    if(!projects){
      return res.json(new ApiError(500, "No  bugs found"));
    }
    return res.json(new ApiResponse(200, "Bugs trends fetched", projects));
  }catch(error){
    console.log(error);
    return res.json(new ApiError(500, "Failed to fetch bug trends"));
  }
})