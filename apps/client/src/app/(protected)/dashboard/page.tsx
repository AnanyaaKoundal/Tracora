"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, Column } from "@/components/Table/DataTable";
import { fetchDashboardData } from "@/services/dashboardService";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useRouter } from "next/navigation";

type DashboardData = {
  role: "admin" | "manager" | "developer" | "tester";
  projects?: any[];
  bugs?: any[];
  bugsSecondRow?: any[]; // bugs for second row table
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

const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#8AFF33", "#FF8A33"];

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
          bugs: stats.row1,        // ✅ first row
          bugsSecondRow: stats.row2, // ✅ second row
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
  

  if (loading) return <div className="text-center py-6">Loading...</div>;
  if (!data) return <div className="text-center py-6">No data available</div>;

  // 🔹 Top projects (sorted by end date)
  const topProjects = Array.isArray(data.projects)
    ? [...data.projects]
        .sort((a, b) => {
          const aTime = a.project_end_date ? new Date(a.project_end_date).getTime() : 0;
          const bTime = b.project_end_date ? new Date(b.project_end_date).getTime() : 0;
          return aTime - bTime;
        })
        .slice(0, 5)
    : [];

  // 🔹 Top bugs for first row (assigned / reported / project bugs)
  const topBugs = Array.isArray(data.bugs) ? [...data.bugs] : [];

  // 🔹 Bugs for second row (developer fixed / tester reported / manager project bugs)
  const secondRowBugs = Array.isArray(data.bugsSecondRow) ? [...data.bugsSecondRow] : [];

  // 🔹 Pie chart data
  const pieData = Array.isArray(data.bugSummary) && data.bugSummary.length > 0
    ? data.bugSummary
    : [
        { name: "Critical", value: 0 },
        { name: "High", value: 0 },
        { name: "Medium", value: 0 },
        { name: "Low", value: 0 },
        { name: "Trivial", value: 0 },
      ];

  // 🔹 Columns
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

  return (
    <div className="space-y-6 p-6">
      {/* Row 1: Table */}
      <Card className="shadow-lg rounded-2xl">
        <CardContent>
          <div className="flex justify-between">
            <h2 className="text-xl font-bold mb-4">
              {data.role === "manager" || data.role === "admin" ? "Projects" : "Assigned Bugs"}
            </h2>
            <button onClick={handleSeeAll} className="text-primary hover:underline">
              See all
            </button>
          </div>
          {(data.role === "manager" || data.role === "admin" ? topProjects : topBugs).length > 0 ? (
            <DataTable
              columns={data.role === "manager" || data.role === "admin" ? columnsProjects : columnsBugs}
              data={data.role === "manager" || data.role === "admin" ? topProjects : topBugs}
            />
          ) : (
            <p className="text-center text-gray-500">No items found</p>
          )}
        </CardContent>
      </Card>

      {/* Row 2: 70% Table + 30% Pie Chart */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Bugs Table */}
        <div className="md:w-9/12">
          <Card className="shadow-lg rounded-2xl">
            <CardContent>
              <div className="flex justify-between">
                <h2 className="text-xl font-bold mb-4">
                  {data.role === "manager" || data.role === "admin" 
                    ? "Top Bugs in Projects"
                    : data.role === "developer"
                    ? "Bugs Fixed by Me"
                    : "Bugs Reported by Me"}
                </h2>
                <button onClick={handleSeeAll} className="text-primary hover:underline">
                  See all
                </button>
              </div>
              {secondRowBugs.length > 0 ? (
                <DataTable columns={columnsBugs} data={secondRowBugs} />
              ) : (
                <p className="text-center text-gray-500">No bugs found</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart */}
        <div className="md:w-5/12">
          <Card className="shadow-lg rounded-2xl">
            <CardContent>
              <h2 className="text-xl font-bold mb-4">Bug Status Overview</h2>
              {pieData.length > 0 ? (
                <PieChart width={300} height={300}>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              ) : (
                <p className="text-center text-gray-500">No bug data</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
