"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchProjectForDashboard } from "@/services/adminService"; // <-- your service
import Link from "next/link";

type Project = {
  project_id: string;
  project_name: string;
  project_status: string;
  project_end_date: string;
  created_by: string;
};

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetchProjectForDashboard();
        console.log("Projects:", res);
        if (res.success) setProjects(res.data);
        else toast.error(res.message || "Failed to fetch projects");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load projects");
      }
    }
    loadProjects();
  }, []);

  return (
    <Card className="h-full shadow-md">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-lg font-semibold">Top Projects</CardTitle>
        <Link
          href="/admin/projects" 
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent>
        {projects.length > 0 ? (
          <div className="space-y-3">
            {projects.map((p) => (
              <div
                key={p.project_id}
                className="flex justify-between items-center p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
              >
                <div>
                  <p className="font-medium">{p.project_name}</p>
                  <p className="text-sm text-gray-600">ID: {p.project_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{p.project_status}</p>
                  <span className="text-sm font-medium text-blue-600">
                    ETA:{" "}
                    {p.project_end_date
                      ? new Date(p.project_end_date).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No projects available</p>
        )}
      </CardContent>
    </Card>
  );
}
