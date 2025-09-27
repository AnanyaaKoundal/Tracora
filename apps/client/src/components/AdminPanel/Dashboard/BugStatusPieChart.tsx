"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { fetchAllBugsService } from "@/services/bugService";
import { toast } from "sonner";

type Bug = {
  bug_status: "Open" | "Closed" | "Under Review" | "Fixed";
};

const COLORS = ["#f87171", "#22c55e", "#facc15", "#3b82f6"]; // Red, Green, Yellow, Blue

export default function BugStatusPieChart() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    async function loadStatusData() {
      try {
        const res = await fetchAllBugsService();
        if (res.success && Array.isArray(res.data)) {
          const counts: Record<string, number> = {};

          res.data.forEach((bug: Bug) => {
            counts[bug.bug_status] = (counts[bug.bug_status] || 0) + 1;
          });

          const chartData = Object.entries(counts).map(([name, value]) => ({
            name,
            value,
          }));
          setData(chartData);
        } else {
          toast.error(res.message || "Failed to fetch bug status data");
        }
      } catch (err) {
        console.error(err);
        toast.warning("Failed to fetch bug status data");
      }
    }

    loadStatusData();
  }, []);

  return (
    <Card className="h-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Bug Status Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={120}
              label={false} 
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
