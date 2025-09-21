"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { fetchAllBugsService } from "@/services/bugService";
import { toast } from "sonner";

type Bug = {
  bug_priority: "Low" | "Medium" | "High";
};

const dummyPriorityData = [
  { name: "Low", value: 6 },
  { name: "Medium", value: 10 },
  { name: "High", value: 5 },
];

const COLORS = ["#93c5fd", "#facc15", "#f87171"];

export default function BugPriorityPieChart() {
  const [data, setData] = useState(dummyPriorityData);

  useEffect(() => {
    async function loadPriorityData() {
      try {
        const res = await fetchAllBugsService();
        if (res.success && Array.isArray(res.data)) {
          const counts: Record<string, number> = {};
          res.data.forEach((bug: Bug) => {
            counts[bug.bug_priority] = (counts[bug.bug_priority] || 0) + 1;
          });

          const chartData = Object.entries(counts).map(([name, value]) => ({
            name,
            value,
          }));
          setData(chartData);
        } else {
          toast.error(res.message || "Failed to fetch bug priority data");
        }
      } catch {
        toast.warning("Using dummy bug priority data");
      }
    }
    loadPriorityData();
  }, []);

  return (
    <Card className="h-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Bug Priority Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              outerRadius={90}
              label
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
