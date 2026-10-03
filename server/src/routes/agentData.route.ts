import express from "express";
import { getBug, getProjects } from "../controllers/agent/agentData.controller";
import { authenticate } from "@/middlewares/auth.middleware";
import { requireInternalKey } from "@/middlewares/internal.middleware";

const Router = express.Router();

// Internal only: the key proves the AI service is calling, the token proves which user
// it is acting for. Both are required, so data access is never wider than the user's.
Router.use(requireInternalKey, authenticate);

Router.route("/bugs/:bug_id").get(getBug);
Router.route("/projects").get(getProjects);

export default Router;
