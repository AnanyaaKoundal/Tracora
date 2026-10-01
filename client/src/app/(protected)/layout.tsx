'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/ProtectedLayout/Sidebar';
import AdminSidebar from '@/components/AdminPanel/AdminSidebar';
import Navbar from '@/components/LandingPage/Navbar';
import ProtectedNavbar from '@/components/Navbar/ProtectedNavbar';
import AssistantBadge from '@/components/Assistant/AssistantBadge';
import AssistantPanel from '@/components/Assistant/AssistantPanel';
import AssistantWorkspace from '@/components/Assistant/AssistantWorkspace';
// import { useSSEConnection } from '@/hooks/useSSE';
import { useAuthStore } from '@/schemas/authStore';
import { useAssistantStore } from '@/schemas/assistantStore';

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  const employeeId = useAuthStore((s) => s.employeeId);
  const assistantOpen = useAssistantStore((s) => s.open);
  const assistantExpanded = useAssistantStore((s) => s.expanded);
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

        {/*
          The page stays mounted while the assistant expands, only hidden. If it
          unmounted, the page's useAssistantContext cleanup would clear the very context
          the workspace needs, so expanding would lose the screen it is meant to know.
        */}
        <main className={assistantExpanded ? 'hidden' : 'p-6 overflow-auto'}>{children}</main>
        {assistantExpanded && (
          <div className="flex-1 min-h-0 bg-slate-100 p-3">
            <AssistantWorkspace />
          </div>
        )}
      </div>

      {/* Assistant */}
      {assistantOpen && !assistantExpanded && <AssistantPanel />}
      {!assistantExpanded && <AssistantBadge />}
    </div>
  );
}
