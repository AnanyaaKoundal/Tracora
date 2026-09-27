import express from "express";
import { getDuplicates, getTitleSuggestion } from "@/controllers/ai/ai.controller";
import { authenticate, authorizeRole } from "@/middlewares/auth.middleware";

const Router = express.Router();

Router.use(authenticate, authorizeRole(["developer", "manager", "tester", "admin"]));

Router.route("/duplicates").post(getDuplicates);
Router.route("/suggest-title").post(getTitleSuggestion);

export default Router;
