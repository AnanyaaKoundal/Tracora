import mongoose from "mongoose";

const citationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["bug", "project"],
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

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
    // Records the answer referenced, rendered as clickable chips. Stored so a
    // reopened conversation still shows what each answer grounded on.
    citations: {
      type: [citationSchema],
      default: [],
    },
    // The bug/project page the user was on for this turn, if any. Compared against
    // the next turn's context so the agent can tell the user just navigated.
    context_id: {
      type: String,
      default: null,
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
