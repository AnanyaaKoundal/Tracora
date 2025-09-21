"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { fetchProjectsService } from "@/services/admin/projectService"; // hypothetical service
import { toast } from "sonner";

type Project = {
  project_id: string;
  project_name: string;
  eta: string;
};

const dummyProjects: Project[] = [
  { project_id: "P-101", project_name: "Tracora Core", eta: "2025-12-01" },
  { project_id: "P-102", project_name: "Tracora AI", eta: "2026-03-15" },
  { project_id: "P-103", project_name: "Tracora API", eta: "2025-11-20" },
];

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>(dummyProjects);

  useEffect(() => {
    async function loadProjects() {
      try {
        // const res = await fetchProjectsService();
        // if (res.success) setProjects(res.data);
        // else toast.error(res.message || "Failed to fetch projects");
      } catch {
        toast.warning("Using dummy data for projects");
      }
    }
    loadProjects();
  }, []);

  return (
    <Card className="h-full shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Top Projects</CardTitle>
      </CardHeader>
      <CardContent>
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
              <span className="text-sm font-medium text-blue-600">
                ETA: {p.eta}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
