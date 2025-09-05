import express from "express";
import {
    createRole,
    getRoles,
    getRoleById,
    editRole,
    deleteRoleById,
    deleteRolesByIds,
} from "@/controllers/employee/role.controller";

import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    editEmployee,
    deleteEmployeeById,
  } from "@/controllers/employee/employee.controller";
  import { authenticate, authorizeRole } from "@/middlewares/auth.middleware";

const Router = express.Router();
Router.use(authenticate, authorizeRole(["admin"]));

Router.route("/createRole").post(createRole);
Router.route("/getRoles").get(getRoles);
Router.route("/role/:role_id")
    .get(getRoleById)
    .put(editRole)
    .delete(deleteRoleById);

Router.route("/deleteRoles").delete(deleteRolesByIds);

Router.route("/createEmployee").post(createEmployee);
Router.route("/getAllEmployees").get(getEmployees);
Router.route("/employee/:emp_id")
    .get(getEmployeeById)
    .put(editEmployee)
    .delete(deleteEmployeeById);

export default Router;
