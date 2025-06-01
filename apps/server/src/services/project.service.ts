import { v4 as uuidv4 } from "uuid";
import Project from "../models/project.model";
import ApiError from "../utils/ApiError";

export const createProject = async (projectData: any) => {
  const { project_name } = projectData;

  // Check if project with same name exists
  const existingProject = await Project.findOne({ project_name });
  if (existingProject) {
    throw new ApiError(400, "Project already exists");
  }

  const newProject = await Project.create({
    project_id: uuidv4(),
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
