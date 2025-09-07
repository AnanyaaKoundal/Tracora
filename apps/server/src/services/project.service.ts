import Employee from "@/models/employee.model";
import Project from "../models/project.model";
import ApiError from "../utils/ApiError";
import { generateProjectId } from "./id.service";

export const createProject = async (projectData: any, user: any) => {
  const { project_name } = projectData;
  const existingProject = await Project.findOne({ project_name });
  if (existingProject) {
    throw new ApiError(400, "Project already exists");
  }
  const project_id = generateProjectId();
  const newProject = await Project.create({
    project_id,
    created_by: user.employee_id,
    ...projectData,
  });

  return newProject;
};

export const getProjects = async () => {
  const projects = await Project.find();
  return projects;
};

export const getProjectById = async (project_id: string) => {
  const project = await Project.findOne({ project_id });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

export const editProject = async (project_id: string, updateData: any) => {
  const project = await Project.findOneAndUpdate(
    { project_id },
    { ...updateData, updated_at: Date.now() },
    { new: true }
  );

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

export const deleteProjectById = async (project_id: string) => {
  const assignedEmployees = await Employee.findOne({ projectId: project_id });
  if (assignedEmployees) {
    throw new ApiError(400, "Cannot delete project. Employees are assigned to it.");
  }

  const project = await Project.findOneAndDelete({ project_id });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

export const deleteProjectsByIds = async (projectIds: string[]) => {
  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    throw new ApiError(400, "No project IDs provided");
  }

  const result = await Project.deleteMany({ project_id: { $in: projectIds } });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "No projects deleted");
  }

  return { deletedCount: result.deletedCount };
};
