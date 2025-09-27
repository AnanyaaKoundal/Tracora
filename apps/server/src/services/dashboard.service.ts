// src/services/AdminStatsService.ts
import {getAllProjects} from "@/services/project.service";
import { getAllBugs } from "@/services/bug.service";
import { getEmployees } from "@/services/employee.service";
import Employee from "@/models/employee.model";
import Role from "@/models/role.model";

export const AdminStatsService = async() => {
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

