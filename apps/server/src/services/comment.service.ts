import Comment from "@/models/comment.model";
import Bug from "@/models/bug.model";
import ApiError from "@/utils/ApiError";
import Employee from "@/models/employee.model";

export const createCommentService = async (data: any, user: any) => {
  const { bug_id } = data;

  const existingbug = await Bug.findOne({ bug_id });
  if (!existingbug) {
    throw new ApiError(400, "Bug not found");
  }

  // Initialize `seen` map for all receivers as false
  const seenMap: Record<string, boolean> = {};
  existingbug.notify_users.forEach((userId: string) => {
    seenMap[userId] = false;
  });

  const newComment = await Comment.create({
    bug_id: existingbug.bug_id,
    senderId: user.employee_id,
    receiverId: existingbug.notify_users,
    seen: seenMap,
    ...data,
  });

  return newComment;
};

export const fetchCommentsService = async (bugId: string) => {
  const comments = await Comment.find({ bug_id: bugId })
    .populate({
      path: "senderId",
      model: "Employee",
      localField: "senderId",
      foreignField: "employee_id",   // IMPORTANT: use employee_id instead of default _id
      select: "employee_name employee_email"
    })
    .sort({ createdAt: -1 });

  return comments;
};

export const markCommentAsSeen = async (comment_id: string, employee_id: string) => {
  console.log("Employee ID in markCommentSeen: ", employee_id);
  const result = await Comment.updateOne(
    { _id: comment_id },
    { $set: { [`seen.${employee_id}`]: true } }
  );

  // Optional: return whether a document was modified
  if (result.modifiedCount === 0) {
    console.warn(`Comment ${comment_id} not updated. Maybe already seen or does not exist.`);
  }else{
    console.log(`Comment ${comment_id} marked as seen by user ${employee_id}`);
  }

  return result;
};
