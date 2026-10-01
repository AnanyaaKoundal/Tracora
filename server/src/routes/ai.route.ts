import express from "express";
import {
  getDuplicates,
  getTitleSuggestion,
  chat,
  listConversations,
  getConversation,
  deleteConversation,
} from "@/controllers/ai/ai.controller";
import { authenticate, authorizeRole } from "@/middlewares/auth.middleware";

const Router = express.Router();

Router.use(authenticate, authorizeRole(["developer", "manager", "tester", "admin"]));

Router.route("/duplicates").post(getDuplicates);
Router.route("/suggest-title").post(getTitleSuggestion);
Router.route("/chat").post(chat);

Router.route("/conversations").get(listConversations);
Router.route("/conversations/:conversation_id").get(getConversation);
Router.route("/conversations/:conversation_id").delete(deleteConversation);

export default Router;
