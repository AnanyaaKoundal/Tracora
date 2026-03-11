import Bug from "../models/bug.model";
import ApiError from "../utils/ApiError";
import { generateBugId } from "./id.service";
import { BugPriority } from "../models/bug.model";
import { kafkaProducer } from "@/config/kafka/kafka_producer";

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

  await kafkaProducer.send("bug-created-topic", {
    bug: newbug,
    senderId: user.employee_id,
    senderName: user.employee_name || user.employeeId,
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

export const editBug = async (bug_id: string, updateData: any, user?: any) => {
  console.log("UPDATE:", updateData);
  const oldBug = await Bug.findOne({ bug_id });
  console.log("OLD BUG STATUS:", oldBug?.bug_status);
  console.log("NEW BUG STATUS:", updateData.bug_status);
  
  const bug = await Bug.findOneAndUpdate(
    { bug_id },
    { ...updateData, updated_at: Date.now() },
    { new: true }
  );
  
  if (!bug) {
    throw new ApiError(404, "bug not found");
  }

  if (oldBug && updateData.bug_status && oldBug.bug_status !== updateData.bug_status && user) {
    console.log("SENDING STATUS CHANGE NOTIFICATION", { oldStatus: oldBug.bug_status, newStatus: updateData.bug_status });
    await kafkaProducer.send("bug-status-changed-topic", {
      bug,
      senderId: user.employee_id,
      senderName: user.employee_name || user.employeeId,
      oldStatus: oldBug.bug_status,
      newStatus: updateData.bug_status,
    });
  }

  if (oldBug && updateData.bug_status && oldBug.bug_status !== updateData.bug_status && user) {
    await kafkaProducer.send("bug-status-changed-topic", {
      bug,
      senderId: user.employee_id,
      senderName: user.employee_name || user.employeeId,
      oldStatus: oldBug.bug_status,
      newStatus: updateData.bug_status,
    });
  }

  if (oldBug && updateData.assigned_to && oldBug.assigned_to !== updateData.assigned_to && user) {
    await kafkaProducer.send("bug-assigned-topic", {
      bug,
      senderId: user.employee_id,
      senderName: user.employee_name || user.employeeId,
      newAssignee: updateData.assigned_to,
    });
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