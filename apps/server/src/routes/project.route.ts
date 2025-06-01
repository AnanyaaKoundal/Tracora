import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  editProject,
  deleteProjectById,
  deleteProjectsByIds
} from "../controllers/project/project.controller";

const Router = express.Router();

Router.route("/createProject").post(createProject);

Router.route("/get-projects").get(getProjects);
Router.route("/get-project/:project_id").get(getProjectById);

Router.route("/edit-project").put(editProject);

Router.route("/delete-project").delete(deleteProjectById);
Router.route("/delete-projects").post(deleteProjectsByIds);

export default Router;