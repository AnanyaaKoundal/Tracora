import Bug from "../models/bug.model";
import Project from "../models/project.model";

// Reads for the AI service. The Express server stays the single owner of tenant data:
// the agent asks here instead of talking to Mongo itself.
//
// Scoping is tenant-wide on purpose. PRODUCT-SCOPE: "tenant-wide retrieval,
// role-filtered visibility" -- bug data is public-level within a company, and a project
// is a filter, not a permission boundary (the worked example: D must be able to search
// P3 while assigned to P1). The caller's identity still travels with the request and is
// verified by `authenticate`, so a field-level role matrix can be applied later without
// another plumbing change; it does not hide whole bugs today.

export const getBugForAgent = async (bug_id: string, user: any) => {
  const bug = (await Bug.findOne({
    company_id: user.company_id,
    bug_id,
  }).lean()) as Record<string, any> | null;
  if (!bug) return null;

  // The project name is joined here so the agent needs one call, not two.
  let project_name: string | null = null;
  if (bug.project_id) {
    const project = await Project.findOne(
      { project_id: bug.project_id, company_id: user.company_id },
      { project_name: 1, _id: 0 }
    ).lean();
    project_name = (project as any)?.project_name ?? null;
  }

  return { ...bug, project_name };
};

export const getProjectsForAgent = async (user: any) => {
  return Project.find({ company_id: user.company_id }).lean();
};
