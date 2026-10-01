import Bug from "../models/bug.model";
import Project from "../models/project.model";
import ApiError from "../utils/ApiError";
import { generateBugId } from "./id.service";
import { BugPriority } from "../models/bug.model";
import { kafkaProducer } from "@/config/kafka/kafka_producer";

// A project_id in the body is caller-controlled, so it has to be checked against the
// same tenant as the bug. Otherwise a bug could be filed against another company's
// project and then leak through that project's bug views.
const assertProjectInTenant = async (project_id: unknown, company_id: string) => {
  if (project_id === undefined || project_id === null || project_id === "") return undefined;

  if (typeof project_id !== "string") {
    throw new ApiError(400, "Invalid project_id");
  }

  const project = await Project.findOne({ project_id, company_id });
  if (!project) {
    throw new ApiError(400, "Project does not exist in this company");
  }

  return project_id;
};

export const createBug = async (bugData: any, user: any) => {
  const { bug_name, company_id } = bugData;
  if (!company_id) {
    throw new ApiError(400, "Company ID is required");
  }
  const existingbug = await Bug.findOne({ bug_name, company_id });
  if (existingbug) {
    throw new ApiError(400, "Bug already exists for this company");
  }
  await assertProjectInTenant(bugData.project_id, company_id);
  const bug_id = generateBugId();

  const newbug = await Bug.create({
    bug_id,
    company_id,
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

export const getAllBugs = async (company_id?: string, project_id?: string) => {
  // Both terms are optional, but company_id is always supplied from the verified
  // token. It is what keeps one tenant from reading another's bugs.
  const query: Record<string, unknown> = {};
  if (company_id) query.company_id = company_id;
  if (project_id) query.project_id = project_id;
  const bugs = await Bug.find(query);
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
  const oldBug = await Bug.findOne({ bug_id });

  if (oldBug && "project_id" in updateData) {
    // Re-checked on edit too, otherwise a bug could be moved into another tenant's
    // project after creation.
    updateData.project_id = await assertProjectInTenant(
      updateData.project_id,
      oldBug.company_id
    );
  }

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
  if (!user || !user.company_id) {
    return [];
  }

  if (user.is_admin || user.role === "manager") {
    return await Bug.find({ company_id: user.company_id });
  }

  const bugs = await Bug.find({
    company_id: user.company_id,
    $or: [
      { reported_by: user.employee_id },
      { assigned_to: user.employee_id }
    ]
  });
  return bugs;
};