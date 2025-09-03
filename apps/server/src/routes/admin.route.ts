import express from "express";
import {
    createRole,
    getRoles,
    getRoleById,
    editRole,
    deleteRoleById,
    deleteRolesByIds,
} from "@/controllers/user/role.controller";

import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    editEmployee,
    deleteEmployeeById,
  } from "@/controllers/user/employee.controller";
  import { authenticate, authorizeRole } from "@/middlewares/auth.middleware";

const Router = express.Router();
Router.use(authenticate, authorizeRole(["admin"]));

Router.route("/createRole").post(createRole);
Router.route("/roles").get(getRoles);
Router.route("/role/:role_id")
    .get(getRoleById)
    .put(editRole)
    .delete(deleteRoleById);

Router.route("/deleteRoles").delete(deleteRolesByIds);

Router.route("/createUser").post(createEmployee);
Router.route("/").get(getEmployees);
Router.route("/user/:user_id")
    .get(getEmployeeById)
    .put(editEmployee)
    .delete(deleteEmployeeById);

export default Router;
