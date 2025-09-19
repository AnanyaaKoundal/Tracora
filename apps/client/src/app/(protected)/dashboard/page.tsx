"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchDashboardData } from "@/services/dashboardService";

type DashboardData = {
  projects?: number;
  bugs?: { total: number; open: number; closed: number };
  totalBugs?: number;
  open?: number;
  needInput?: number;
  closed?: number;
  assigned?: number;
  pending?: number;
  resolved?: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      async function fetchData() {
        try {
          const bugData = await fetchDashboardData();
          setData(bugData.data);
          console.log("Dashboard: ", bugData.data);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    }, []);

  if (loading) return <div className="text-center py-6">Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {/* MANAGER */}
      {data?.projects !== undefined && (
        <>
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">Projects</h2>
              <p className="text-3xl">{data.projects}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">Open Bugs</h2>
              <p className="text-3xl">{data.bugs?.open}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">Closed Bugs</h2>
              <p className="text-3xl">{data.bugs?.closed}</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* TESTER */}
      {data?.totalBugs !== undefined && (
        <>
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">My Bugs</h2>
              <p className="text-3xl">{data.totalBugs}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">Open</h2>
              <p className="text-3xl">{data.open}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">Need Info</h2>
              <p className="text-3xl">{data.needInput}</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* DEVELOPER */}
      {data?.assigned !== undefined && (
        <>
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">Assigned</h2>
              <p className="text-3xl">{data.assigned}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">Pending</h2>
              <p className="text-3xl">{data.pending}</p>
            </CardContent>
          </Card>
          <Card className="shadow-lg rounded-2xl">
            <CardContent className="p-4">
              <h2 className="text-xl font-bold">Resolved</h2>
              <p className="text-3xl">{data.resolved}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
