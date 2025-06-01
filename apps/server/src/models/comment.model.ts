import mongoose from "mongoose";
import User from "./user.model";
import Bug from "./bug.model";

const commentSchema = new mongoose.Schema({
    comment_id: {
      type: String,
      required: true,
      unique: true
    },
    bug_id: {
      type: String,
      ref: "Bug",
      required: true,
    },
    sender: {
      type: String,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachments: [
      {
        file_url: String,
        file_name: String,
        file_type: String,
      },
    ],
  },
  { timestamps: true}
)

const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;
