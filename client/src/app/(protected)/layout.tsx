'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/ProtectedLayout/Sidebar';
import AdminSidebar from '@/components/AdminPanel/AdminSidebar';
import Navbar from '@/components/LandingPage/Navbar';
import ProtectedNavbar from '@/components/Navbar/ProtectedNavbar';
import AssistantBadge from '@/components/Assistant/AssistantBadge';
import AssistantPanel from '@/components/Assistant/AssistantPanel';
// import { useSSEConnection } from '@/hooks/useSSE';
import { useAuthStore } from '@/schemas/authStore';

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const pathname = usePathname();4

  const employeeId = useAuthStore((s) => s.employeeId);
  // useSSEConnection(`${process.env.NEXT_PUBLIC_API_URL}/sse/stream/${employeeId}?source=notification`);
  
  const role = pathname.startsWith('/admin') ? 'admin' : 'user';
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar (switches based on role) */}
      {role === 'admin' ? (
        <AdminSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      ) : (
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      )}

      {/* Main content area */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300 ease-in-out
          ${isOpen ? 'ml-64' : 'ml-0'}
        `}
      >
        {/* Navbar */}
        <ProtectedNavbar />

        {/* Page content */}
        <main className="p-6 overflow-auto">{children}</main>
      </div>

      {/* Assistant */}
      {assistantOpen && <AssistantPanel onClose={() => setAssistantOpen(false)} />}
      <AssistantBadge open={assistantOpen} onClick={() => setAssistantOpen((o) => !o)} />
    </div>
  );
}
