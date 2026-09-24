"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/Table/DataTable";
import { fetchDashboardData } from "@/services/dashboardService";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FolderKanban, Bug, TrendingUp, ArrowRight, Clock, CheckCircle } from "lucide-react";

type DashboardData = {
  role: "admin" | "manager" | "developer" | "tester";
  projects?: any[];
  bugs?: any[];
  bugsSecondRow?: any[];
  bugSummary?: { name: string; value: number }[];
};

type Priority = "Critical" | "High" | "Medium" | "Low" | "Trivial";

interface Bug {
  bug_id: string;
  bug_name: string;
  bug_status: string;
  priority: Priority;
  updatedAt: string;
  [key: string]: any;
}

const COLORS = {
  "Critical": "#ef4444",
  "High": "#f97316", 
  "Medium": "#eab308",
  "Low": "#22c55e",
  "Trivial": "#6b7280",
};

const COLORS_ARRAY = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#6b7280"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchDashboardData();
        const stats = res.stats;
        setData({
          role: stats.role,
          projects: stats.projects,
          bugs: stats.row1,        
          bugsSecondRow: stats.row2, 
          bugSummary: stats.bugSummary,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!data) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Bug className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">No data available</p>
      </div>
    </div>
  );

  const topProjects = Array.isArray(data.projects)
    ? [...data.projects]
        .sort((a, b) => {
          const aTime = a.project_end_date ? new Date(a.project_end_date).getTime() : 0;
          const bTime = b.project_end_date ? new Date(b.project_end_date).getTime() : 0;
          return aTime - bTime;
        })
        .slice(0, 5)
    : [];

  const topBugs = Array.isArray(data.bugs) ? [...data.bugs] : [];
  const secondRowBugs = Array.isArray(data.bugsSecondRow) ? [...data.bugsSecondRow] : [];

  const pieData = Array.isArray(data.bugSummary) && data.bugSummary.length > 0
    ? data.bugSummary
    : [
        { name: "Critical", value: 0 },
        { name: "High", value: 0 },
        { name: "Medium", value: 0 },
        { name: "Low", value: 0 },
        { name: "Trivial", value: 0 },
      ];

  const columnsProjects: Column<any>[] = [
    { key: "project_id", header: "ID" },
    { key: "project_name", header: "Name" },
    { key: "project_status", header: "Status" },
    { key: "project_end_date", header: "End Date" },
  ];

  const columnsBugs: Column<any>[] = [
    { key: "bug_id", header: "ID" },
    { key: "bug_name", header: "Title" },
    { key: "priority", header: "Priority" },
    { key: "bug_status", header: "Status" },
    { key: "updatedAt", header: "Updated At" },
  ];

  const handleSeeAll = () => {
    router.push(data.role === "manager" || data.role === "admin" ? "/projects" : "/bugs");
  };

  const getSectionTitle = () => {
    if (data.role === "manager" || data.role === "admin") return "Projects";
    return "Assigned Bugs";
  };

  const getSecondSectionTitle = () => {
    if (data.role === "manager" || data.role === "admin") return "Top Bugs in Projects";
    if (data.role === "developer") return "Bugs Fixed by Me";
    return "Bugs Reported by Me";
  };

  // Calculate stats based on role
  const isManagerOrAdmin = data.role === "manager" || data.role === "admin";
  const isDeveloper = data.role === "developer";
  const isTester = data.role === "tester";
  
  const totalItems = isManagerOrAdmin ? topProjects.length : topBugs.length;
  const openBugs = topBugs.filter(b => b.bug_status === "Open").length;
  const fixedBugs = secondRowBugs.filter(b => b.bug_status === "Fixed" || b.bug_status === "Closed").length;
  
  // Role-specific stat labels
  const getStats = () => {
    if (isManagerOrAdmin) {
      return [
        { label: "Total Projects", value: topProjects.length, icon: FolderKanban, color: "bg-blue-100 text-blue-500" },
        { label: "Active Projects", value: topProjects.filter(p => p.project_status === "Active").length, icon: Clock, color: "bg-green-100 text-green-500" },
        { label: "Total Bugs", value: topBugs.length + secondRowBugs.length, icon: Bug, color: "bg-red-100 text-red-500" },
      ];
    } else if (isDeveloper) {
      return [
        { label: "Assigned to Me", value: topBugs.length, icon: Bug, color: "bg-blue-100 text-blue-500" },
        { label: "Open Bugs", value: openBugs, icon: Clock, color: "bg-red-100 text-red-500" },
        { label: "Fixed by Me", value: fixedBugs, icon: CheckCircle, color: "bg-green-100 text-green-500" },
      ];
    } else { // tester
      return [
        { label: "Reported by Me", value: topBugs.length, icon: Bug, color: "bg-blue-100 text-blue-500" },
        { label: "Open Bugs", value: openBugs, icon: Clock, color: "bg-red-100 text-red-500" },
        { label: "Resolved", value: fixedBugs, icon: CheckCircle, color: "bg-green-100 text-green-500" },
      ];
    }
  };
  
  const stats = getStats();

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Here's an overview of your work.</p>
      </motion.div>

      {/* Quick Stats - Role Specific */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* First Row - Main Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {data.role === "manager" || data.role === "admin" 
                ? <FolderKanban className="w-5 h-5 text-primary" />
                : <Bug className="w-5 h-5 text-primary" />
              }
              {getSectionTitle()}
            </CardTitle>
            <button 
              onClick={handleSeeAll} 
              className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
            >
              See all <ArrowRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <CardContent>
            {(data.role === "manager" || data.role === "admin" ? topProjects : topBugs).length > 0 ? (
              <DataTable
                columns={data.role === "manager" || data.role === "admin" ? columnsProjects : columnsBugs}
                data={data.role === "manager" || data.role === "admin" ? topProjects : topBugs}
                onRowClick={(row) => router.push(data.role === "manager" || data.role === "admin" ? `/projects/${row.project_id}` : `/bugs/${row.bug_id}`)}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No items found
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Second Row - 70% Table + 30% Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Bugs Table */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-0 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {getSecondSectionTitle()}
              </CardTitle>
              <button 
                onClick={handleSeeAll} 
                className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
              >
                See all <ArrowRight className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              {secondRowBugs.length > 0 ? (
                <DataTable columns={columnsBugs} data={secondRowBugs} onRowClick={(row) => router.push(`/bugs/${row.bug_id}`)} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No bugs found
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm border-0 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Bug className="w-5 h-5 text-primary" />
                Priority Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.some(d => d.value > 0) ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS_ARRAY[index % COLORS_ARRAY.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: 'none', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-center mt-2">
                    <span className="text-2xl font-bold">
                      {pieData.reduce((sum, item) => sum + item.value, 0)}
                    </span>
                    <p className="text-sm text-muted-foreground">Total Bugs</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bug className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No bug data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
