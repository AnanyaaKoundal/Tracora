// app/(protected)/layout.tsx
import { ReactNode } from "react";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <div className="text-lg font-bold mb-4">Tracora</div>
        <nav className="space-y-2">
          <a href="/dashboard" className="block hover:bg-gray-700 p-2 rounded">
            Dashboard
          </a>
          <a href="/projects" className="block hover:bg-gray-700 p-2 rounded">
            Projects
          </a>
          <a href="/bugs" className="block hover:bg-gray-700 p-2 rounded">
            Bugs
          </a>
          <a href="/" className="block hover:bg-gray-700 p-2 rounded">
            Logout
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Navbar */}
        <header className="bg-white shadow p-4 flex justify-end items-center">
          {/* <div className="text-xl font-semibold">Dashboard</div> */}
          <div className="flex items-center space-x-4">
            <div>🔔</div>
            <div>👤 User</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
