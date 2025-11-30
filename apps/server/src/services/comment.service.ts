import Comment from "@/models/comment.model";
import Bug from "@/models/bug.model";
import ApiError from "@/utils/ApiError";
import Employee from "@/models/employee.model";

export const createCommentService = async (data: any, user: any) => {
    console.log("Comment: ", data);
    console.log("User: ", user);

    const {bug_id} = data;

    const existingbug = await Bug.findOne({bug_id});
    console.log("Exist: ", existingbug);
    if (!existingbug) {
        throw new ApiError(400, "Bug not found");
    }
  
    const newComment = await Comment.create({
        bug_id: existingbug.bug_id,
      senderId: user.employee_id,
      receiverId: existingbug.notify_users,
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
  