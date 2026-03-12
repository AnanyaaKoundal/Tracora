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
import { fetchBugTrendsforDashboard } from "@/services/adminService";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Calendar } from "lucide-react";

type TrendData = {
  date: string;
  created: number;
  closed: number;
};

export default function BugTrendsLineChart() {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrendData() {
      try {
        const res = await fetchBugTrendsforDashboard();
        if (res.success) setData(res.data);
        else toast.error(res.message || "Failed to fetch bug trends data");
      } catch {
        toast.error("Failed to fetch bug trends");
      } finally {
        setLoading(false);
      }
    }
    loadTrendData();
  }, []);

  return (
    <Card className="shadow-sm border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Bug Trends Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="w-full h-[300px] bg-gray-100 rounded-xl animate-pulse" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36}
                formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
              />
              <Line 
                type="monotone" 
                dataKey="created" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Bugs Created"
              />
              <Line 
                type="monotone" 
                dataKey="closed" 
                stroke="#22c55e" 
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Bugs Closed"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No trend data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
