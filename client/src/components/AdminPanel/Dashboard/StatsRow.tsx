"use client";

import { motion } from "framer-motion";
import { FolderKanban, Bug, Users, CheckCircle, Clock } from "lucide-react";

interface Stats {
  projects: {
    total: number;
    active: number;
  };
  bugs: {
    total: number;
    open: number;
    closed: number;
  };
  employees: {
    total: number;
  };
}

interface DashboardStatsRowProps {
  stats: Stats;
}

const statCards = [
  { label: "Total Projects", value: (s: Stats) => s.projects.total, icon: FolderKanban, color: "bg-blue-500" },
  { label: "Active Projects", value: (s: Stats) => s.projects.active, icon: Clock, color: "bg-green-500" },
  { label: "Total Bugs", value: (s: Stats) => s.bugs.total, icon: Bug, color: "bg-red-500" },
  { label: "Open Bugs", value: (s: Stats) => s.bugs.open, icon: Bug, color: "bg-orange-500" },
  { label: "Closed Bugs", value: (s: Stats) => s.bugs.closed, icon: CheckCircle, color: "bg-emerald-500" },
  { label: "Team Members", value: (s: Stats) => s.employees.total, icon: Users, color: "bg-purple-500" },
];

export default function DashboardStatsRow({ stats }: DashboardStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">
            {card.value(stats)}
          </div>
          <div className="text-sm text-muted-foreground">{card.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
