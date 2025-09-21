"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchAllBugsService } from "@/services/bugService";
import { toast } from "sonner";
import { success } from "zod";

type Bug = {
  bug_status: "Open" | "Closed" | "Under Review" | "Fixed";
  createdAt: string;
  closedAt?: string;
};

const dummyTrendData = [
  { date: "2025-09-08", created: 5, closed: 2 },
  { date: "2025-09-09", created: 8, closed: 5 },
  { date: "2025-09-10", created: 6, closed: 3 },
  { date: "2025-09-11", created: 9, closed: 7 },
  { date: "2025-09-12", created: 7, closed: 6 },
];

export default function BugTrendsLineChart() {
  const [data, setData] = useState(dummyTrendData);

  useEffect(() => {
    async function loadTrendData() {
      try {
        const res = {success: false, data:[], message: ""};
        // const res = await fetchAllBugsService();
        if (res.success && Array.isArray(res.data)) {
          const bugList: Bug[] = res.data;
          const counts: Record<string, { created: number; closed: number }> = {};

          bugList.forEach((bug) => {
            const createdDate = bug.createdAt.split("T")[0];
            counts[createdDate] = counts[createdDate] || { created: 0, closed: 0 };
            counts[createdDate].created++;

            if (bug.bug_status === "Closed" && bug.closedAt) {
              const closedDate = bug.closedAt.split("T")[0];
              counts[closedDate] = counts[closedDate] || { created: 0, closed: 0 };
              counts[closedDate].closed++;
            }
          });

          const chartData = Object.entries(counts)
            .sort(([a], [b]) => a.localeCompare(b)) // sort by date ascending
            .map(([date, values]) => ({
              date,
              created: values.created,
              closed: values.closed,
            }));

          setData(chartData);
        } else {
          toast.error(res.message || "Failed to fetch bug trends data");
        }
      } catch {
        toast.warning("Using dummy bug trend data");
      }
    }
    loadTrendData();
  }, []);

  return (
    <Card className="h-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Bug Trends Over Time</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Bugs Created" />
            <Line type="monotone" dataKey="closed" stroke="#22c55e" name="Bugs Closed" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
