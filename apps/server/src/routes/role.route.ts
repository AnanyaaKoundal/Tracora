import express from "express";
import {
  createRole,
  getRoles,
  getRoleById,
  editRole,
  deleteRoleById,
  deleteRolesByIds,
} from "../controllers/user/role.controller";

const Router = express.Router();

// Get all roles
Router.route("/").get(getRoles);

// Operations on a specific role by ID (get, update, delete)
Router.route("/role/:role_id")
  .get(getRoleById)


export default Router;