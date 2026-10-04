import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  editEmployee,
  deleteEmployeeById,
  getAllAssigneesController,
} from "../controllers/employee/employee.controller";
import { getDashboardStats } from "@/controllers/employee/dashboard.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const Router = express.Router();

// Every handler here scopes by company_id from the verified token, so authenticate has
// to run first. Without it the caller identity is missing entirely.
Router.use(authenticate);

//Get all users
Router.route("/").get(getEmployees);

Router.route("/user/:emp_id")
  .get(getEmployeeById)
  .put(editEmployee)

Router.route("/dashboard").get(getDashboardStats);

Router.route("/getAssignees").get(getAllAssigneesController);

export default Router;