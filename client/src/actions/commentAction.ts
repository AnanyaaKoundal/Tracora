import { CreateCommentSchema } from "@/schemas/comment.schema";
import { fetchCommentsService, postCommentService } from "@/services/commentService";

export interface FetchCommentsResponse {
  success: boolean;
  comments: any[];
}

export async function postComment(data: CreateCommentSchema){
  try {
      const bug = await postCommentService(data);
      return { success: true, data: bug };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to post comment" };
    }
}

export async function fetchComments(bugId: string): Promise<FetchCommentsResponse>  {

  const data = await fetchCommentsService(bugId);
  console.log("Dataaa: ", data);
  if (data.status === 403) {
    window.location.href = "/forbidden"; 
  return{ success: false, comments: []};
}
  if (!data.success) {
    console.error("Failed to fetch roles!!!!", data.error);
    return{ success: false, comments: []};
  }

  return {
    success: true,
    comments: data.data,
  };
  
}