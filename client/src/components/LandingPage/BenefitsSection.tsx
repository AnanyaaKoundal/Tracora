'use client';

import { motion } from "framer-motion";
import { 
  Zap, 
  Shield, 
  Clock, 
  HeadphonesIcon,
  GitBranch,
  Smartphone
} from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Real-time updates with WebSockets and Kafka for instant bug notifications.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Role-based access control keeps your data safe with granular permissions.",
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Streamlined workflow reduces bug resolution time by 50% on average.",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Our team is always here to help you succeed with dedicated support.",
  },
  {
    icon: GitBranch,
    title: "Developer Friendly",
    description: "RESTful APIs and easy integrations with your existing tools.",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere",
    description: "Responsive design works perfectly on desktop, tablet, and mobile.",
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 px-6 lg:px-12 bg-white">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Teams <span className="text-primary">Choose Tracora</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built by developers, for developers. We understand what matters most in bug tracking.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex gap-4 p-4"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <benefit.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
