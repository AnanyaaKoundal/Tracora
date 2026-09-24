import express from "express";
import {
  getProjectsByRole,
  getProjectById,
} from "../controllers/project/project.controller";
import { authenticate, authorizeRole } from "@/middlewares/auth.middleware";

const Router = express.Router();

Router.route("/get-projects").get(authenticate, authorizeRole(["developer", "manager", "tester", "admin"]), getProjectsByRole);
Router.route("/get-project/:project_id").get(getProjectById);

export default Router;