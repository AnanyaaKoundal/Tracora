"use client";

import ProjectsList from "@/components/AdminPanel/Dashboard/ProjectList";
import EmployeesList from "@/components/AdminPanel/Dashboard/EmployeeList";
import BugsList from "@/components/AdminPanel/Dashboard/RecentBugList";
import StatusPieCharts from "@/components/AdminPanel/Dashboard/BugStatusPieChart";
import BugTrendChart from "@/components/AdminPanel/Dashboard/BugTrendsLineChart";
import DashboardStatsRow from "@/components/AdminPanel/Dashboard/StatsRow";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/actions/dsahboardAction";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const dashboardData = await getDashboardStats();
        setData(dashboardData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-50/50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your projects.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </motion.div>

      {/* Stats Row */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : data?.stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <DashboardStatsRow stats={data.stats} />
        </motion.div>
      )}

      {/* Row 1: Projects + Employees */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-6"
      >
        <div className="lg:col-span-2">
          <ProjectsList />
        </div>
        <div className="lg:col-span-3">
          <EmployeesList />
        </div>
      </motion.div>

      {/* Row 2: Bugs + Charts */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2">
          <BugsList />
        </div>
        <div className="lg:col-span-1">
          <StatusPieCharts />
        </div>
      </motion.div>

      {/* Row 3: Trends */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="w-full"
      >
        <BugTrendChart />
      </motion.div>
    </div>
  );
}
