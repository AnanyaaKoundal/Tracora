"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchBugsforDashboard } from "@/services/adminService"; // new service
import { toast } from "sonner";
import Link from "next/link";

type Bug = {
  bug_id: string;
  bug_name: string;
  bug_status: "Open" | "Closed" | "Under Review" | "Fixed";
  createdAt: string;
};

export default function RecentBugsList() {
  const [bugs, setBugs] = useState<Bug[]>([]);

  useEffect(() => {
    async function loadBugs() {
      try {
        const res = await fetchBugsforDashboard(); // fetch latest 5 bugs
        if (res.success) setBugs(res.data);
        else toast.error(res.message || "Failed to fetch bugs");
      } catch {
        toast.error("Failed to fetch recent bugs");
      }
    }
    loadBugs();
  }, []);

  return (
    <Card className="h-full shadow-md">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">Recent Bugs</CardTitle>
        <Link
          href="/bugs" // replace with your actual employee page route
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bugs.map((bug) => (
            <div
              key={bug.bug_id}
              className="flex justify-between items-center p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
            >
              <div>
                <p className="font-medium">{bug.bug_name}</p>
                <p className="text-xs text-gray-600">
                  {new Date(bug.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  bug.bug_status === "Open"
                    ? "bg-red-100 text-red-700"
                    : bug.bug_status === "Closed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {bug.bug_status}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
