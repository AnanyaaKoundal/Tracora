'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, Github, Twitter, Mail, Send, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-gradient-to-b from-slate-900 to-black text-slate-300 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full px-6 lg:px-12 relative z-10">
        <div className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Ship <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">Bug-Free</span> Code
            </h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-8">
              Join thousands of teams who trust Tracora to deliver quality software. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register/company">
                <Button size="lg" className="text-lg px-8 py-6 h-auto">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto bg-transparent">
                  See Features
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Bug className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Tracora</span>
              </div>
              <p className="text-slate-400 text-lg max-w-md">
                Modern bug tracking for modern software teams. Catch every bug before it catches you.
              </p>
              <div className="flex gap-3 pt-2">
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-all"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a 
                  href="#" 
                  className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-all"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a 
                  href="mailto:support@tracora.com" 
                  className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-all"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              {submitted ? (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Message Sent!</h3>
                  <p className="text-slate-400 text-sm">We&apos;ll get back to you within 24 hours.</p>
                </div>
              ) : (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-semibold text-lg mb-4">Get in Touch</h3>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="Your email"
                    />
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                      placeholder="How can we help?"
                    />
                    <Button type="submit" className="w-full">
                      Send Message
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              &copy; {currentYear} Tracora. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="mailto:support@tracora.com" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
