import { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler";
import { getBugForAgent, getProjectsForAgent } from "../../services/agentData.service";

export const getBug = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const bug = await getBugForAgent(req.params.bug_id, user);

  if (!bug) {
    // Not found and not visible are the same answer on purpose: the agent must not be
    // able to confirm a bug exists for a user who cannot see it.
    res.status(404).json({ success: false, message: "Bug not found" });
    return;
  }

  res.status(200).json({ success: true, data: bug });
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const projects = await getProjectsForAgent(user);
  res.status(200).json({ success: true, data: projects });
});
