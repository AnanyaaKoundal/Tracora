import Bug from "../models/bug.model";
import ApiError from "../utils/ApiError";
import { generateBugId } from "./id.service";
import { BugPriority } from "../models/bug.model";

export const createBug = async (bugData: any, user: any) => {
  console.log("BUGDATA: ", bugData);
  const { bug_name } = bugData;
  console.log("Bug: ", user);
  const existingbug = await Bug.findOne({ bug_name });
  if (existingbug) {
    throw new ApiError(400, "Bug already exists");
  }
  const bug_id = generateBugId();

  const newbug = await Bug.create({
    bug_id,
    reported_by: user.employee_id,
    ...bugData,
  });

  return newbug;
};

export const getAllBugs = async () => {
  const bugs = await Bug.find();
  return bugs;
};

export const getBugById = async (bug_id: string) => {
  const bug = await Bug.findOne({ bug_id });

  if (!bug) {
    throw new ApiError(404, "Bug not found");
  }

  return bug;
};

export const editBug = async (bug_id: string, updateData: any) => {
  const bug = await Bug.findOneAndUpdate(
    { bug_id },
    { ...updateData, updated_at: Date.now() },
    { new: true }
  );

  if (!bug) {
    throw new ApiError(404, "bug not found");
  }

  return bug;
};

export const deleteBugById = async (bug_id: string) => {

  const bug = await Bug.findOneAndDelete({ bug_id });

  if (!bug) {
    throw new ApiError(404, "bug not found");
  }

  return bug;
};

export const deleteBugsByIds = async (bugIds: string[]) => {
  if (!Array.isArray(bugIds) || bugIds.length === 0) {
    throw new ApiError(400, "No bug IDs provided");
  }

  const result = await Bug.deleteMany({ bug_id: { $in: bugIds } });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "No bugs deleted");
  }

  return { deletedCount: result.deletedCount };
};


export const getBugs = async (user: any) => {
  console.log("User; ", user);
  if (!user || !user.bugId) {
    return [];
  }

  const bugs = await Bug.find({
    reported_by: { $in: user.employee_id }
  });
  console.log("bugs: ", bugs);
  return bugs;
};