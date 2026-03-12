"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fetchBugsforDashboard } from "@/services/adminService";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bug, Calendar, ArrowRight } from "lucide-react";

type Bug = {
  bug_id: string;
  bug_name: string;
  bug_status: "Open" | "Closed" | "Under Review" | "Fixed";
  createdAt: string;
};

const statusColors: Record<string, string> = {
  Open: "bg-red-100 text-red-700 border-red-200",
  "Under Review": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Fixed: "bg-blue-100 text-blue-700 border-blue-200",
  Closed: "bg-green-100 text-green-700 border-green-200",
};

const statusIcons: Record<string, string> = {
  Open: "🔴",
  "Under Review": "🟡",
  Fixed: "🔵",
  Closed: "🟢",
};

export default function RecentBugsList() {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBugs() {
      try {
        const res = await fetchBugsforDashboard();
        if (res.success) setBugs(res.data);
        else toast.error(res.message || "Failed to fetch bugs");
      } catch {
        toast.error("Failed to fetch recent bugs");
      } finally {
        setLoading(false);
      }
    }
    loadBugs();
  }, []);

  return (
    <Card className="h-full shadow-sm border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bug className="w-5 h-5 text-primary" />
          Recent Bugs
        </CardTitle>
        <Link
          href="/bugs"
          className="text-sm font-medium text-primary hover:text-primary/80 transition flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : bugs.length > 0 ? (
          <div className="space-y-3">
            {bugs.slice(0, 6).map((bug, index) => (
              <motion.div
                key={bug.bug_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-lg">
                    🐛
                  </div>
                  <div>
                    <p className="font-medium text-foreground line-clamp-1">{bug.bug_name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="font-mono">{bug.bug_id}</span>
                      <span>•</span>
                      <Calendar className="w-3 h-3" />
                      {new Date(bug.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex items-center gap-1 ${statusColors[bug.bug_status] || "bg-gray-100 text-gray-700"}`}>
                    <span>{statusIcons[bug.bug_status]}</span>
                    {bug.bug_status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Bug className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No bugs found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
