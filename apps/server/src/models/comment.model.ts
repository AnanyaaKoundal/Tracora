import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    bug_id: {
      type: String,
      ref: "Bug",
      required: true,
    },
    senderId: {
      type: String,
      ref: "Employee",
      required: true,
    },
    receiverId: [{
      type: String,
      ref: "Employee",
    }],
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
    isDeleted:{
      type: Boolean,
      default: false,
    },
    isEdited:{
      type: Boolean,
      default: false,
    },
    taggedUsers: [{
      type: String,
      ref: "Employee",
    }],
    isReplyTo: {
      type: String,
      ref: "Comment"
    }
  },
  { timestamps: true}
)

const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default Comment;