// src/services/AdminStatsService.ts
import { getAllProjects } from "@/services/project.service";
import { getAllBugs } from "@/services/bug.service";
import { getEmployees } from "@/services/employee.service";
import Employee from "@/models/employee.model";
import Role from "@/models/role.model";
import Project from "@/models/project.model";
import { SortOrder } from "mongoose";
import Bug from "@/models/bug.model";

type RoleType = "admin" | "manager" | "developer" | "tester";

export const AdminStatsService = async () => {
  // Fetch all items using existing services
  const [projects, bugs, employees] = await Promise.all([
    getAllProjects(),  // returns full project array
    getAllBugs(),          // returns full bug array
    getEmployees() // returns full employee array
  ]);

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.project_status === "Active").length;

  const totalBugs = bugs.length;
  const activeBugs = bugs.filter(b => b.bug_status === "Open" || b.status === "iUnder Review").length;

  const totalEmployees = employees.length;

  return {
    projects: {
      total: totalProjects,
      active: activeProjects,
    },
    bugs: {
      total: totalBugs,
      open: activeBugs,
      closed: totalBugs - activeBugs,
    },
    employees: {
      total: totalEmployees,
    },
  }
}

export const getEmployeeForTable = async () => {
  const adminRole = await Role.findOne({ role_name: "admin" });

  const employees = await Employee.find({ roleId: { $ne: adminRole?.role_id } })
    .populate({
      path: "roleId",
      model: Role,
      select: "role_name role_id",
      localField: "roleId",
      foreignField: "role_id"
    })
    .limit(3)
    .exec();

  return employees.map((emp) => ({
    employee_id: emp.employee_id.toString(),
    employee_name: emp.employee_name,
    employee_email: emp.employee_email,
    role: (emp.roleId[0] as any)?.role_name || "",
  }));
};

type ProjectRow = {
  project_id: string;
  project_name: string;
  project_status: string;
  project_end_date?: Date | string | null;
  created_by: string;
};

/**
 * Return up to `limit` projects for the admin table.
 * Priority: Upcoming (by start date) -> Active (by end date) -> Completed (by end date) -> others.
 */
export const getProjectsForTable = async (limit = 3): Promise<ProjectRow[]> => {
  const statusesPriority = ["Upcoming", "Active", "Completed"];
  const picked: any[] = [];
  const pickedIds = new Set<string>();

  const populateOptions = {
    path: "created_by",
    model: Employee,
    select: "employee_name employee_email employee_id",
    localField: "created_by",
    foreignField: "employee_id",
  };

  // helper: fetch projects for a status with appropriate sort and remaining limit
  async function fetchByStatus(status: string, remaining: number) {
    if (remaining <= 0) return [];

    const sortObj: Record<string, SortOrder> =
  status === "Upcoming"
    ? { project_start_date: "asc", project_end_date: "asc" }
    : status === "Completed"
    ? { project_end_date: "asc", project_start_date: "asc" }
    : { project_end_date: "asc", project_start_date: "asc" };

const docs = await Project.find({ project_status: status })
  .sort(sortObj)
  .limit(remaining)
  .populate(populateOptions)
  .exec();

    // filter duplicates by project_id
    return docs.filter((d) => !pickedIds.has(d.project_id));
  }

  // 1) Try each prioritized status
  for (const status of statusesPriority) {
    if (picked.length >= limit) break;
    const remaining = limit - picked.length;
    const docs = await fetchByStatus(status, remaining);
    for (const d of docs) {
      if (picked.length >= limit) break;
      pickedIds.add(d.project_id);
      picked.push(d);
    }
  }

  // 2) If still not enough, fetch projects of any other status (excluding already used statuses)
  if (picked.length < limit) {
    const remaining = limit - picked.length;
    const others = await Project.find({ project_status: { $nin: statusesPriority } })
      .sort({ project_end_date: 1, project_start_date: 1 })
      .limit(remaining)
      .populate(populateOptions)
      .exec();

    for (const d of others) {
      if (picked.length >= limit) break;
      if (!pickedIds.has(d.project_id)) {
        pickedIds.add(d.project_id);
        picked.push(d);
      }
    }
  }

  // 3) Map to the UI shape
  return picked.map((proj) => ({
    project_id: proj.project_id,
    project_name: proj.project_name,
    project_status: proj.project_status,
    project_end_date: proj.project_end_date ?? null,
    created_by: Array.isArray(proj.created_by)
      ? (proj.created_by[0] as any)?.employee_name || ""
      : (proj.created_by as any)?.employee_name || "",
  }));
};

export const getBugsforDashboard = async () => {
  const bugs = await Bug.find()
    .limit(4)
    .exec();

  return bugs.map((b) => ({
    bug_id: b.bug_id,
    bug_name: b.bug_name,
    bug_status: b.bug_status,
    bug_priority: b.bug_priority,
    // reported_by: (b.reported_by as any)?.employee_name || "",
    // assigned_to: (b.assigned_to as any)?.employee_name || "",
    createdAt: b.createdAt,
    // closedAt: b.closedAt,
  }));
};

// Return recent bugs (sorted by creation date)
export const getRecentBugs = async (limit = 5) => {
  const bugs = await Bug.find()
    .sort({ createdAt: -1 } as Record<string, SortOrder>)
    .limit(limit)
    .populate({ path: "reported_by", select: "employee_name employee_id" })
    .populate({ path: "assigned_to", select: "employee_name employee_id" })
    .exec();

  return bugs.map((b) => ({
    bug_id: b.bug_id,
    bug_name: b.bug_name,
    bug_status: b.bug_status,
    createdAt: b.createdAt,
  }));
};

// Return bug trends for chart
export const getBugTrends = async () => {
  const bugs = await Bug.find().exec();

  const counts: Record<string, { created: number; closed: number }> = {};

  bugs.forEach((bug) => {
    const createdDate = bug.createdAt.toISOString().split("T")[0];
    counts[createdDate] = counts[createdDate] || { created: 0, closed: 0 };
    counts[createdDate].created++;

    if (bug.bug_status === "Closed" || bug.bug_status === "Fixed") {
      const closedDate = bug.updatedAt.toISOString().split("T")[0];
      counts[closedDate] = counts[closedDate] || { created: 0, closed: 0 };
      counts[closedDate].closed++;
    }
  });
  console.log("BUGSS: ", bugs);
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, val]) => ({ date, created: val.created, closed: val.closed }));
};

// Return bug count by priority for pie chart
export const getBugPriorityStats = async () => {
  const bugs = await Bug.find().exec();

  const stats: Record<string, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Trivial: 0,
  };

  // bugs.forEach((b) => {
  //   const priorityName = Object.keys(Bug.bug_priority || {})[b.bug_priority - 1];
  //   stats[priorityName] = (stats[priorityName] || 0) + 1;
  // });

  return Object.entries(stats).map(([name, value]) => ({ name, value }));
};

// Return dashboard data for a user
export const getDashboardData = async (userId: string, role: RoleType) => {
  let row1Data: any[] = [];
  let row2Data: any[] = [];

  // 🔹 Manager: top projects + bugs in those projects
  if (role === "manager" || role === "admin") {
    row1Data = await Project.find()
      .sort({ project_end_date: 1 } as Record<string, SortOrder>)
      .limit(5)
      .exec();

    const projectIds = row1Data.map(p => p.project_id);

    row2Data = await Bug.find();
    
  } else if (role === "developer") {
    // 🔹 Developer: assigned bugs
    row1Data = await Bug.find({ assigned_to: userId })
    .sort({ updatedAt: -1 } as Record<string, SortOrder>)
    .exec();
    
    row2Data = await Bug.find({ assigned_to: userId, bug_status: { $in: ["Closed", "Fixed"] } })
    .sort({ updatedAt: -1 } as Record<string, SortOrder>)
    .exec();
    
  } else if (role === "tester") {
    // 🔹 Tester: reported bugs
    row1Data = await Bug.find({ reported_by: userId })
    .sort({ updatedAt: -1 } as Record<string, SortOrder>)
    .exec();
    console.log("Tester Row 2: ", row1Data);

    row2Data = row1Data; // All reported bugs for second row
  }

  // 🔹 Bug priority stats (all relevant bugs)
  const allBugs = await Bug.find(
    (role === "manager" ||  role === "admin") ? { project_id: { $in: row1Data.map(p => p.project_id) } } :
    role === "developer" ? { assigned_to: userId } :
    { reported_by: userId }
  ).exec();

  const priorityCounts: Record<string, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Trivial: 0,
  };

  allBugs.forEach(b => {
    const pr = b.bug_priority;
    if (pr && priorityCounts[pr] !== undefined) priorityCounts[pr]++;
  });

  const bugSummary = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

  // 🔹 Return structured dashboard data
  return {
    role,
    projects: role === "manager" || role === "admin" ? row1Data.map(p => ({
      project_id: p.project_id,
      project_name: p.project_name,
      project_status: p.project_status,
      project_end_date: p.project_end_date,
      created_by: Array.isArray(p.created_by) ? (p.created_by[0] as any)?.employee_name || "" : (p.created_by as any)?.employee_name || "",
    })) : [],
    row1: role === "manager" || role === "admin" ? [] : row1Data.map(b => ({
      bug_id: b.bug_id,
      bug_name: b.bug_name,
      bug_status: b.bug_status,
      priority: b.bug_priority,
      updatedAt: b.updatedAt,
      reported_by: (b.reported_by as any)?.employee_name || "",
      assigned_to: (b.assigned_to as any)?.employee_name || "",
    })),
    row2: row2Data.map(b => ({
      bug_id: b.bug_id,
      bug_name: b.bug_name,
      bug_status: b.bug_status,
      priority: b.bug_priority,
      updatedAt: b.updatedAt,
      reported_by: (b.reported_by as any)?.employee_name || "",
      assigned_to: (b.assigned_to as any)?.employee_name || "",
    })),
    bugSummary,
  };
};
