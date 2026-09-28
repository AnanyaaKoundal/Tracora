import express from "express";
import { getDuplicates, getTitleSuggestion, chat } from "@/controllers/ai/ai.controller";
import { authenticate, authorizeRole } from "@/middlewares/auth.middleware";

const Router = express.Router();

Router.use(authenticate, authorizeRole(["developer", "manager", "tester", "admin"]));

Router.route("/duplicates").post(getDuplicates);
Router.route("/suggest-title").post(getTitleSuggestion);
Router.route("/chat").post(chat);

export default Router;
