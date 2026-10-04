import express from "express";
import {
  createRole,
  getRoles,
  getRoleById,
  editRole,
  deleteRoleById,
  deleteRolesByIds,
} from "../controllers/employee/role.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const Router = express.Router();

// These handlers scope by company_id from the verified token, so authenticate has to
// run first. Without it the caller identity is missing entirely.
Router.use(authenticate);

// Get all roles
Router.route("/").get(getRoles);

// Operations on a specific role by ID (get, update, delete)
Router.route("/role/:role_id")
  .get(getRoleById)


export default Router;