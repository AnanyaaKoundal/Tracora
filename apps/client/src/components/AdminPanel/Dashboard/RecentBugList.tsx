"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchAllBugsService } from "@/services/bugService"; // your existing bug service
import { toast } from "sonner";

type Bug = {
  bug_id: string;
  bug_name: string;
  bug_status: string;
  createdAt: string;
};

const dummyBugs: Bug[] = [
  {
    bug_id: "B-101",
    bug_name: "Login page not redirecting",
    bug_status: "Open",
    createdAt: "2025-09-10T12:30:00Z",
  },
  {
    bug_id: "B-102",
    bug_name: "Broken link in footer",
    bug_status: "Closed",
    createdAt: "2025-09-09T15:10:00Z",
  },
  {
    bug_id: "B-103",
    bug_name: "Slow response in dashboard",
    bug_status: "Under Review",
    createdAt: "2025-09-08T10:00:00Z",
  },
];

export default function RecentBugsList() {
  const [bugs, setBugs] = useState<Bug[]>(dummyBugs);

  useEffect(() => {
    async function loadBugs() {
      try {
        const res = await fetchAllBugsService();
        if (res.success && Array.isArray(res.data)) {
          const sortedBugs = res.data.sort(
            (a: Bug, b: Bug) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setBugs(sortedBugs);
        } else {
          toast.error(res.message || "Failed to fetch bugs");
        }
      } catch {
        toast.warning("Using dummy data for bugs");
      }
    }
    loadBugs();
  }, []);

  return (
    <Card className="h-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recent Bugs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bugs.slice(0, 5).map((bug) => (
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
