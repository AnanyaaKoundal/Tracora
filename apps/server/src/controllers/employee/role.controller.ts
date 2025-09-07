import { Request, Response, NextFunction } from "express";
import * as roleService from "../../services/role.service";
import asyncHandler from "../../utils/asyncHandler";
import ApiResponse from "../../utils/ApiResponse";
import { request } from "http";

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const newRole = await roleService.createRole(req.body);
  res.status(201).json(new ApiResponse(201, "Role created successfully", newRole));
});

// Get all Roles
export const getRoles = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await roleService.getRoles();
  res.status(200).json(new ApiResponse(200, "Roles fetched successfully", roles));
});

// Get Role by ID
export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.getRoleById(req.params.role_id);
  res.status(200).json(new ApiResponse(200, "Role fetched successfully", role));
});

// Edit Role by ID
export const editRole = asyncHandler(async (req: Request, res: Response) => {
  const updatedRole = await roleService.editRole(req.params.role_id, req.body);
  res.status(200).json(new ApiResponse(200, "Role updated successfully", updatedRole));
});

// Delete Role by ID
export const deleteRoleById = asyncHandler(async (req: Request, res: Response) => {
  const deletedRole = await roleService.deleteRoleById(req.params.role_id);
  res.status(200).json(new ApiResponse(200, "Role deleted successfully", deletedRole));
});

// Delete multiple Roles by IDs (expects array of role_ids in req.body.roleIds)
export const deleteRolesByIds = asyncHandler(async (req: Request, res: Response) => {
  const { roleIds } = req.body;
  const result = await roleService.deleteRolesByIds(roleIds);
  res.status(200).json(new ApiResponse(200, `${result.deletedCount} roles deleted successfully`, result));
});
