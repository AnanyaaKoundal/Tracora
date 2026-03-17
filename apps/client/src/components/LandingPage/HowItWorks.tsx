'use client';

import { motion } from "framer-motion";
import { Building2, FolderKanban, Bug, UserCheck, MessageSquare, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Building2,
    title: "1. Create Your Company",
    description: "Sign up and create your company workspace. Add team members and assign roles.",
  },
  {
    icon: FolderKanban,
    title: "2. Set Up Projects",
    description: "Create projects and define their timeline. Organize work with features and milestones.",
  },
  {
    icon: Bug,
    title: "3. Report Bugs",
    description: "Testers report bugs with detailed descriptions, screenshots, and priority levels.",
  },
  {
    icon: UserCheck,
    title: "4. Assign & Track",
    description: "Assign bugs to developers. Track progress with real-time status updates.",
  },
  {
    icon: MessageSquare,
    title: "5. Collaborate",
    description: "Discuss issues in real-time comments. Tag team members for quick resolution.",
  },
  {
    icon: CheckCircle,
    title: "6. Resolve & Analyze",
    description: "Close bugs and analyze trends. Use analytics to prevent future issues.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 lg:px-12 bg-slate-50">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            How <span className="text-primary">Tracora</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes and streamline your bug tracking workflow
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-white p-6 rounded-2xl shadow-sm border h-full">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Step {index + 1}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
