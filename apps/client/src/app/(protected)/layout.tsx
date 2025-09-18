'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/ProtectedLayout/Sidebar';
import AdminSidebar from '@/components/AdminPanel/AdminSidebar';
import Navbar from '@/components/LandingPage/Navbar';
import ProtectedNavbar from '@/components/Navbar/ProtectedNavbar';

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  
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
    </div>
  );
}
