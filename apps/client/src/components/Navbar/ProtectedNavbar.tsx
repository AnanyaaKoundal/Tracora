"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchRole } from "@/actions/employeeAction"; // ✅ your service

export default function ProtectedNavbar() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const isInAdminMode = pathname.startsWith("/admin");

  useEffect(() => {
    async function getRole() {
      try {
        const data = await fetchRole(); 
        console.log("Fetched role: ", data)
        setRole(data.role); // assumes backend returns { role: "admin" }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    getRole();
  }, []);

  function handleModeSwitch() {
    if (isInAdminMode) {
      router.push("/dashboard");
    } else {
      router.push("/admin/dashboard");
    }
  }

  if (loading) return null; // or a small skeleton

  return (
    <header className="bg-white shadow p-4 flex justify-end items-center h-16">
      {/* <div className="font-bold text-lg">Tracora</div> */}

      <div className="flex items-center space-x-4">
        {role === "admin" && (
          <button
            onClick={handleModeSwitch}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {isInAdminMode ? "Switch to Work Mode" : "Switch to Admin Mode"}
          </button>
        )}

        <div>🔔</div>
        <div>👤</div>
      </div>
    </header>
  );
}
