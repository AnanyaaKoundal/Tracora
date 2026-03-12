"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { fetchAllBugsService } from "@/services/bugService";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Bug, TrendingUp } from "lucide-react";

type BugStatus = "Open" | "Closed" | "Under Review" | "Fixed";

interface BugData {
  bug_status: BugStatus;
}

const COLORS_ARRAY = ["#ef4444", "#22c55e", "#eab308", "#3b82f6"];

export default function BugStatusPieChart() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadStatusData() {
      try {
        const res = await fetchAllBugsService();
        
        if (res?.success && Array.isArray(res.data)) {
          const counts: Record<string, number> = {};
          
          res.data.forEach((bug: BugData) => {
            const status = bug.bug_status || "Open";
            counts[status] = (counts[status] || 0) + 1;
          });
          
          const chartData = Object.entries(counts).map(([name, value]) => ({
            name,
            value,
          }));
          
          setData(chartData);
        } else {
          // If no data or API error, set empty but don't show error state
          setData([]);
        }
      } catch (err) {
        console.error("Failed to load bug status data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadStatusData();
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // If there's no data but not loading, show empty state
  if (!loading && data.length === 0 && !error) {
    return (
      <Card className="h-full shadow-sm border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Bug Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-[300px]">
          <div className="text-center text-muted-foreground">
            <Bug className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No bug data available</p>
            <p className="text-xs mt-1">Create some bugs to see the distribution</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full shadow-sm border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Bug Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        {loading ? (
          <div className="w-full h-[300px] bg-gray-100 rounded-xl animate-pulse" />
        ) : data.length > 0 ? (
          <div className="w-full">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS_ARRAY[index % COLORS_ARRAY.length]} 
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }}
                  formatter={(value: number) => [`${value} bugs`, '']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-2">
              <span className="text-3xl font-bold text-foreground">{total}</span>
              <p className="text-sm text-muted-foreground">Total Bugs</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Bug className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No bug data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
