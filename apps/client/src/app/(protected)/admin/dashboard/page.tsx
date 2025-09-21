"use client";

import ProjectsList from "@/components/AdminPanel/Dashboard/ProjectList";
import EmployeesList from "@/components/AdminPanel/Dashboard/EmployeeList";
import BugsList from "@/components/AdminPanel/Dashboard/RecentBugList";
import StatusPieCharts from "@/components/AdminPanel/Dashboard/BugPriorityPieChart";
import BugTrendChart from "@/components/AdminPanel/Dashboard/BugTrendsLineChart";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-gray-50">
      {/* Row 1: Projects + Employees */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <ProjectsList />
        </div>
        <div className="md:col-span-3">
          <EmployeesList />
        </div>
      </div>

      {/* Row 2: Bugs + Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <BugsList />
        </div>
        <div className="md:col-span-1">
          <StatusPieCharts />
        </div>
      </div>

      {/* Row 3: Trends */}
      <div className="w-full">
        <BugTrendChart />
      </div>
    </div>
  );
}
