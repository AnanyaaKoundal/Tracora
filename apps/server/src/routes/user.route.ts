import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  editUser,
  deleteUserById,
} from "../controllers/user/user.controller";

const Router = express.Router();

// Create user
Router.route("/createUser").post(createUser);

//Get all users
Router.route("/get-users").get(getUsers);

Router.route("/user").get(getUsers);
Router.route("edit-user").put(editUser)
Router.route("/delete-user").delete(deleteUserById);

export default Router;