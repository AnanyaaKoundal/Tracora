'use client';

import { useState } from 'react';
import { logout } from '@/actions/loginAction';
import { Menu, X, LayoutDashboard, Shield, Users, FolderKanban, Building2, ChevronRight, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from "js-cookie";

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/roles", label: "Manage Roles", icon: Shield },
  { href: "/admin/employees", label: "Manage Employees", icon: Users },
  { href: "/admin/projects", label: "Manage Projects", icon: FolderKanban },
  { href: "/admin/company", label: "Manage Company", icon: Building2 },
];

export default function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      Cookies.remove("token");
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <button
        className={`
    fixed top-2 z-[60] p-1.5 bg-white border border-gray-200 rounded-lg shadow-md
    hover:bg-slate-50 transition-all duration-300
    ${isOpen ? "left-60" : "left-3"}
  `}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={16} /> : <Menu size={16} />}
      </button>
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 h-full w-64 bg-white border-r border-gray-100 z-40
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          transition-transform duration-300 ease-in-out
          flex flex-col
        `}
      >

        {/* Logo */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-foreground">Tracora</span>
              <span className="text-xs text-muted-foreground block">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:text-primary"}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
