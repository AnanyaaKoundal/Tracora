import express from "express";
import { 
    createBug, 
    deleteBugById, 
    editBug, 
    getAllBugs, 
    getBugsById,
    getbugById
} from "@/controllers/bug/bug.controller"; 
import { authenticate, authorizeRole } from "@/middlewares/auth.middleware";

const Router = express.Router();
Router.use(authenticate, authorizeRole(["developer", "manager", "tester"]));

Router.route("/create-bug").post(createBug);
Router.route("/getAllbugs").get(getAllBugs);
Router.route("/:bug_id")
    .get(getbugById)
    .put(editBug)
Router.route("/delete/:bug_id")
    .delete(deleteBugById);

export default Router;