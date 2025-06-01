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

// Create role
Router.route("/createRole").post(createRole);

// Get all roles
Router.route("/getRoles").get(getRoles);

// Operations on a specific role by ID (get, update, delete)
Router.route("/role/:role_id")
  .get(getRoleById)
  .put(editRole)
  .delete(deleteRoleById);

// Bulk delete roles by IDs
Router.route("/deleteRoles").delete(deleteRolesByIds);

export default Router;