"use client";

import StatsCircle from "./StatsCircle";

interface Stats {
  projects: {
    total: number;
    active: number;
  };
  bugs: {
    total: number;
    open: number;
    closed: number;
  };
  employees: {
    total: number;
  };
}

interface DashboardStatsRowProps {
  stats: Stats;
}

export default function DashboardStatsRow({ stats }: DashboardStatsRowProps) {
    console.log("ROEEW", stats);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
      <StatsCircle label="Total Projects" value={stats.projects.total} />
      <StatsCircle label="Active Projects" value={stats.projects.active} />
      <StatsCircle label="Total Bugs" value={stats.bugs.total} />
      <StatsCircle label="Active Bugs" value={stats.bugs.open} />
      <StatsCircle label="Total Employees" value={stats.employees.total} />
    </div>
  );
}
