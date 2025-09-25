// controllers/dashboard.controller.ts
import { Request, Response } from "express";
import Project from "@/models/project.model";
import Bug from "@/models/bug.model";

export const getDashboardData = async (req: Request, res: Response): Promise<any> => {
  try {
    const { role, employee_id } = (req as any).user; // assuming user is attached by authenticate middleware
    let data = {};

    if (role === "manager") {
      const projects = await Project.find({ manager: employee_id }).populate("bugs");
      data = {
        projects: projects.length,
        bugs: {
          total: projects.reduce((acc, p) => acc + p.bugs.length, 0),
          open: projects.reduce(
            (acc, p) => acc + p.bugs.filter((b: any) => b.status === "open").length,
            0
          ),
          closed: projects.reduce(
            (acc, p) => acc + p.bugs.filter((b: any) => b.status === "closed").length,
            0
          ),
        },
      };
    }

    if (role === "tester") {
      const bugs = await Bug.find({ reportedBy: employee_id });
      data = {
        totalBugs: bugs.length,
        open: bugs.filter(b => b.status === "open").length,
        needInput: bugs.filter(b => b.status === "need-info").length,
        closed: bugs.filter(b => b.status === "closed").length,
      };
    }

    if (role === "developer") {
      const bugs = await Bug.find({ assignedTo: employee_id });
      data = {
        assigned: bugs.length,
        pending: bugs.filter(b => b.status === "open").length,
        resolved: bugs.filter(b => b.status === "resolved").length,
      };
    }
    return res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Dashboard fetch failed" });
  }
};
