'use client';

import { motion } from "framer-motion";
import { Users, Bug, FolderKanban, TrendingUp } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "10K+",
    label: "Team Members",
    description: "Collaborating on projects",
  },
  {
    icon: Bug,
    value: "50K+",
    label: "Bugs Tracked",
    description: "Successfully resolved",
  },
  {
    icon: FolderKanban,
    value: "5K+",
    label: "Projects",
    description: "Managed actively",
  },
  {
    icon: TrendingUp,
    value: "99%",
    label: "Satisfaction",
    description: "User satisfaction rate",
  },
];

export default function StatsSection() {
  return (
    <section className="py-16 px-4 bg-white border-y">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-primary mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.description}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
