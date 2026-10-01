import express from "express";
import {
  getProjectsByRole,
  getProjectById,
  getCompanyProjects,
} from "../controllers/project/project.controller";
import { authenticate, authorizeRole } from "@/middlewares/auth.middleware";

const Router = express.Router();

Router.route("/get-projects").get(authenticate, authorizeRole(["developer", "manager", "tester", "admin"]), getProjectsByRole);
// Every project in the caller's own company. Needed by the bug filing form, which is
// open to every role, so it cannot sit behind the admin-only /admin/get-projects.
Router.route("/company-projects").get(authenticate, getCompanyProjects);
// Without authenticate, this reads any project by id across tenants.
Router.route("/get-project/:project_id").get(authenticate, getProjectById);

export default Router;