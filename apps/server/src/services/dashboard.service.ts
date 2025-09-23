// src/services/AdminStatsService.ts
import {getAllProjects} from "@/services/project.service";
import { getAllBugs } from "@/services/bug.service";
import { getEmployees } from "@/services/employee.service";

class AdminStatsService {
  async getCircleStats() {
    // Fetch all items using existing services
    const [projects, bugs, employees] = await Promise.all([
      getAllProjects(),  // returns full project array
      getAllBugs(),          // returns full bug array
      getEmployees() // returns full employee array
    ]);

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === "active").length;

    const totalBugs = bugs.length;
    const activeBugs = bugs.filter(b => b.status === "open" || b.status === "in-progress").length;

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
    };
  }
}

export default new AdminStatsService();
