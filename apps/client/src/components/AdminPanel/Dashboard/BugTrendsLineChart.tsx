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
import { fetchBugTrendsforDashboard } from "@/services/adminService"; // new service
import { toast } from "sonner";

type TrendData = {
  date: string;
  created: number;
  closed: number;
};

export default function BugTrendsLineChart() {
  const [data, setData] = useState<TrendData[]>([]);

  useEffect(() => {
    async function loadTrendData() {
      try {
        const res = await fetchBugTrendsforDashboard();
        if (res.success) setData(res.data);
        else toast.error(res.message || "Failed to fetch bug trends data");
      } catch {
        toast.error("Failed to fetch bug trends");
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
