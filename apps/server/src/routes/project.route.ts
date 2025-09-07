import express from "express";
import {
  getProjects,
  getProjectById,
} from "../controllers/project/project.controller";

const Router = express.Router();

Router.route("/get-projects").get(getProjects);
Router.route("/get-project/:project_id").get(getProjectById);

export default Router;