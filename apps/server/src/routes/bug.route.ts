import express from "express";
import { 
    createBug, 
    deleteBugById, 
    editBug, 
    getAllBugs, 
    getBugsById 
} from "@/controllers/bug/bug.controller";
import { authenticate, authorizeRole } from "@/middlewares/auth.middleware";
import { getBugById } from "@/services/bug.service";

const Router = express.Router();
Router.use(authenticate, authorizeRole(["developer", "manager", "tester"]));

Router.route("/create-bug").post(createBug);
Router.route("/getAllbugs").get(getAllBugs);
Router.route("/get-project/:bug_id")
    .get(getBugById)
    .put(editBug)
    .delete(deleteBugById);

export default Router;