import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  editEmployee,
  deleteEmployeeById,
  getAllAssigneesController,
} from "../controllers/employee/employee.controller";
import { getDashboardData } from "@/controllers/employee/dashboard.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const Router = express.Router();

//Get all users
Router.route("/").get(getEmployees);

Router.route("/user/:user_id")
  .get(getEmployeeById)
  .put(editEmployee)

Router.route("/dashboard").get(authenticate, getDashboardData);

Router.route("/getAssignees").get(authenticate, getAllAssigneesController);

export default Router;