import { fetchAdminStats } from "@/services/adminService";

export async function getDashboardStats() {
  try {
    const statsData = await fetchAdminStats();
    console.log("DASHBOARD: ", statsData);
    if (statsData.status === 403) {
      window.location.href = "/forbidden";
      return;
    }

    if (!statsData.success) {
      console.error("Failed to fetch stats", statsData.error);
      return {};
    }

    return statsData; // only circle stats
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {};
  }
}
