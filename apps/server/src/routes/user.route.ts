import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  editUser,
  deleteUserById,
} from "../controllers/user/employee.controller";

const Router = express.Router();

// Create user
Router.route("/createUser").post(createUser);

//Get all users
Router.route("/").get(getUsers);

Router.route("/user/:user_id")
  .get(getUserById)
  .put(editUser)
  .delete(deleteUserById);

export default Router;