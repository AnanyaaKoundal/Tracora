import mongoose from "mongoose";

const conversationMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    // Retrieval steps the client renders under an assistant answer. Kept so a
    // reopened conversation looks the same as it did when it was live.
    steps: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    conversation_id: {
      type: String,
      required: true,
      unique: true,
    },
    company_id: {
      type: String,
      required: true,
      ref: "Company",
    },
    employee_id: {
      type: String,
      required: true,
      ref: "Employee",
    },
    title: {
      type: String,
      required: true,
    },
    // Derived from the page context that started the conversation. Lets the sidebar
    // label and filter conversations without inspecting their messages.
    kind: {
      type: String,
      enum: ["general", "bug", "draft"],
      default: "general",
    },
    project_id: {
      type: String,
      default: null,
    },
    messages: {
      type: [conversationMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Sidebar query: one employee's conversations, newest activity first.
conversationSchema.index({ company_id: 1, employee_id: 1, updatedAt: -1 });

const Conversation =
  mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);

export default Conversation;
