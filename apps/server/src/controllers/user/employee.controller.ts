import { Request, Response } from "express";
import asyncHandler from "@/utils/asyncHandler";
import * as userService from "@services/employee.service";
import ApiResponse from "@/utils/ApiResponse";

// Create user
export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.createEmployee(req.body);
  res.status(201).json(new ApiResponse(201, "Employee created", result));
});

// Get all users
export const getEmployees = asyncHandler(async (_req: Request, res: Response) => {
  const result = await userService.getEmployees();
  console.log("Fetched users: ", result);
  res.status(200).json(new ApiResponse(200, "Employees fetched", result));
});

// Get user by ID
export const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getEmployeeById(req.params.user_id);
  res.status(200).json(new ApiResponse(200, "Employee fetched", result));
});

// Edit user
export const editEmployee = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.editEmployee(req.params.user_id, req.body);
  res.status(200).json(new ApiResponse(200, "Employee updated", result));
});

// Delete user
export const deleteEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.deleteEmployeeById(req.params.user_id);
  res.status(200).json(new ApiResponse(200, "Employee deleted", result));
});
