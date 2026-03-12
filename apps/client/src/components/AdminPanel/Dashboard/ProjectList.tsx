"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchProjectForDashboard } from "@/services/adminService";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderKanban, Calendar, ArrowRight } from "lucide-react";

type Project = {
  project_id: string;
  project_name: string;
  project_status: string;
  project_end_date: string;
  created_by: string;
};

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700 border-green-200",
  Completed: "bg-blue-100 text-blue-700 border-blue-200",
  Upcoming: "bg-purple-100 text-purple-700 border-purple-200",
  Inactive: "bg-gray-100 text-gray-700 border-gray-200",
  Overdue: "bg-red-100 text-red-700 border-red-200",
};

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetchProjectForDashboard();
        if (res.success) setProjects(res.data);
        else toast.error(res.message || "Failed to fetch projects");
      } catch (err) {
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  return (
    <Card className="h-full shadow-sm border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-primary" />
          Top Projects
        </CardTitle>
        <Link
          href="/admin/projects" 
          className="text-sm font-medium text-primary hover:text-primary/80 transition flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-3">
            {projects.slice(0, 5).map((p, index) => (
              <motion.div
                key={p.project_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{p.project_name}</p>
                    <p className="text-xs text-muted-foreground">ID: {p.project_id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColors[p.project_status] || "bg-gray-100 text-gray-700"}`}>
                    {p.project_status}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground justify-end">
                    <Calendar className="w-3 h-3" />
                    {p.project_end_date ? new Date(p.project_end_date).toLocaleDateString() : "No deadline"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No projects available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
