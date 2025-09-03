import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  editEmployee,
  deleteEmployeeById,
} from "../controllers/user/employee.controller";

const Router = express.Router();

//Get all users
Router.route("/").get(getEmployees);

Router.route("/user/:user_id")
  .get(getEmployeeById)
  .put(editEmployee)

export default Router;