'use client';

import { motion } from "framer-motion";
import { 
  Bug, 
  Users, 
  Bell, 
  BarChart3, 
  Shield, 
  MessageSquare, 
  Kanban,
  Zap,
  Layers,
  TrendingUp
} from "lucide-react";

const features = [
  {
    icon: Bug,
    title: "Smart Bug Tracking",
    description: "Track bugs from creation to resolution with detailed priorities, statuses, and assignments.",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    description: "Define roles for Developers, Testers, and Managers with granular permissions.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Bell,
    title: "Real-Time Notifications",
    description: "Get instant notifications for bug assignments, status changes, and comments via WebSockets.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: MessageSquare,
    title: "Collaborative Comments",
    description: "Discuss bugs with your team in real-time. Tag users and resolve issues faster.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Kanban,
    title: "Project Management",
    description: "Organize work with projects and features. Track progress from development to deployment.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Visualize bug trends, team performance, and project health with interactive charts.",
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    icon: Layers,
    title: "Multi-Project Support",
    description: "Manage multiple projects from a single dashboard. Keep teams organized and efficient.",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: TrendingUp,
    title: "Bug Trend Analysis",
    description: "Track bug patterns over time. Identify recurring issues and prevent future bugs.",
    color: "bg-pink-100 text-pink-600",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-4 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            Everything You Need to Ship <span className="text-primary">Clean Code</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete bug tracking solution that adapts to your team's workflow
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
