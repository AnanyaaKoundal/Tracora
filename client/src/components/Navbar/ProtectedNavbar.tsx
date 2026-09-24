"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchRole } from "@/actions/employeeAction";
import NotificationBell from "@/components/Navbar/NotificationBell";
import { motion } from "framer-motion";
import { LayoutDashboard, Settings, LogOut, User, ChevronDown } from "lucide-react";
import Cookies from "js-cookie";

export default function ProtectedNavbar() {
  const [role, setRole] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();

  const isInAdminMode = pathname.startsWith("/admin");
  const isAdmin = role === "admin";

  useEffect(() => {
    async function getRole() {
      try {
        const data = await fetchRole();
        setRole(data.role);
        setEmployeeId(data.employee_id);
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }
    getRole();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleModeSwitch() {
    if (isInAdminMode) {
      router.push("/dashboard");
    } else {
      router.push("/admin/dashboard");
    }
  }

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    Cookies.remove("token");
    router.push("/auth/login");
  }

  if (loading) return null;

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 px-6 flex items-center sticky top-0 z-50">
      
      {/* Right Section */}
      <div className="flex items-center gap-3 ml-auto">

        {/* Admin Mode Toggle */}
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleModeSwitch}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
              isInAdminMode 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600" 
                : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600"
            }`}
          >
            {isInAdminMode ? "Switch to Work Mode" : "Switch to Admin Mode"}
          </motion.button>
        )}

        {/* Notification Component */}
        {employeeId && <NotificationBell employeeId={employeeId} />}

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-sm font-medium">
              <User className="w-4 h-4" />
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border py-2"
            >
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium">Account</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>

              {isAdmin && (
                <button
                  onClick={handleModeSwitch}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-slate-50 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {isInAdminMode ? "Go to Work Dashboard" : "Go to Admin Dashboard"}
                </button>
              )}

              <button
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>

              {isAdmin && <hr className="my-2" />}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}