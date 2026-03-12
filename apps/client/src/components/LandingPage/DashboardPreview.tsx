'use client';

import { motion } from "framer-motion";
import { Monitor, Maximize2 } from "lucide-react";

export default function DashboardPreview() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">
            See Tracora in <span className="text-primary">Action</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A clean, intuitive interface that makes bug tracking a breeze
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="bg-gray-900 rounded-2xl p-2 shadow-2xl">
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="bg-gray-700 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-gray-600 rounded-md px-4 py-1 text-xs text-gray-400 flex items-center gap-2">
                    <Monitor className="w-3 h-3" />
                    tracora.app/dashboard
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-900 min-h-[400px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                
                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <img 
                      src="/logo.svg" 
                      alt="Tracora Logo" 
                      className="w-12 h-12"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = document.createElement('div');
                        fallback.className = 'text-primary text-3xl font-bold';
                        fallback.textContent = 'T';
                        e.currentTarget.parentElement?.appendChild(fallback);
                      }}
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Dashboard Preview</h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    Add your dashboard screenshot here to showcase your implementation
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-800 px-4 py-2 rounded-lg">
                    <Maximize2 className="w-4 h-4" />
                    Recommended: 1200 x 800px
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Active Bugs', value: '24', color: 'bg-red-500' },
                    { label: 'Team Members', value: '12', color: 'bg-blue-500' },
                    { label: 'Projects', value: '8', color: 'bg-green-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-gray-800/80 backdrop-blur rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-lg p-4 max-w-xs hidden md:block">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-sm">Live Notifications</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time updates when bugs are assigned or status changes
            </p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8 text-sm text-muted-foreground"
        >
          Replace this placeholder with your actual dashboard screenshot for a live preview
        </motion.p>
      </div>
    </section>
  );
}
