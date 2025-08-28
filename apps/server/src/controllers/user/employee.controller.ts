import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import * as userService from "../../services/employee.service";
import ApiResponse from "../../utils/ApiResponse";

// Create user
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.createUser(req.body);
  res.status(201).json(new ApiResponse(201, "User created", result));
});

// Get all users
export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const result = await userService.getUsers();
  console.log("Fetched users: ", result);
  res.status(200).json(new ApiResponse(200, "Users fetched", result));
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.getUserById(req.params.user_id);
  res.status(200).json(new ApiResponse(200, "User fetched", result));
});

// Edit user
export const editUser = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.editUser(req.params.user_id, req.body);
  res.status(200).json(new ApiResponse(200, "User updated", result));
});

// Delete user
export const deleteUserById = asyncHandler(async (req: Request, res: Response) => {
  const result = await userService.deleteUserById(req.params.user_id);
  res.status(200).json(new ApiResponse(200, "User deleted", result));
});
