import { Request, Response } from "express";
import * as projectService from "../../services/project.service";
import asyncHandler from "../../utils/asyncHandler";

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const newProject = await projectService.createProject(req.body);
  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: newProject,
  });
});

export const getProjects = asyncHandler(async (_req: Request, res: Response) => {
  const projects = await projectService.getProjects();
  res.status(200).json({
    success: true,
    message: "Projects fetched successfully",
    data: projects,
  });
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(req.params.project_id);
  res.status(200).json({
    success: true,
    message: "Project fetched successfully",
    data: project,
  });
});

export const editProject = asyncHandler(async (req: Request, res: Response) => {
  const updatedProject = await projectService.editProject(req.params.project_id, req.body);
  res.status(200).json({
    success: true,
    message: "Project updated successfully",
    data: updatedProject,
  });
});

export const deleteProjectById = asyncHandler(async (req: Request, res: Response) => {
  const deletedProject = await projectService.deleteProjectById(req.params.project_id);
  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
    data: deletedProject,
  });
});

export const deleteProjectsByIds = asyncHandler(async (req: Request, res: Response) => {
  const { projectIds } = req.body as { projectIds: string[] };
  const result = await projectService.deleteProjectsByIds(projectIds);
  res.status(200).json({
    success: true,
    message: "Projects deleted successfully",
    data: result,
  });
});
