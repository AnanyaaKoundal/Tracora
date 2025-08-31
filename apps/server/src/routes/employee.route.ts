import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  editEmployee,
  deleteEmployeeById,
} from "../controllers/user/employee.controller";

const Router = express.Router();

// Create user
Router.route("/createUser").post(createEmployee);

//Get all users
Router.route("/").get(getEmployees);

Router.route("/user/:user_id")
  .get(getEmployeeById)
  .put(editEmployee)
  .delete(deleteEmployeeById);

export default Router;