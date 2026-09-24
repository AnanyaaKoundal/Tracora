import express from "express";

import {
    createComment,
    fetchComments
} from "@/controllers/comment/comment.controller";
import { authenticate } from "@/middlewares/auth.middleware";

const Router = express.Router();

Router.route("/postComment").post(authenticate, createComment);
Router.route("/fetchComments").post(authenticate, fetchComments);

export default Router;