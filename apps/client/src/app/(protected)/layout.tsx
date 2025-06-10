'use client';

import { ReactNode, useState } from 'react';
import Sidebar from '@/components/ProtectedLayout/Sidebar';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      {/* Main content area */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300 ease-in-out
          ${isOpen ? 'ml-64' : 'ml-0'}
        `}
      >
        {/* Navbar */}
        <header className="bg-white shadow p-4 flex justify-end items-center">
          {/* <div className="text-xl font-semibold">Dashboard</div> */}
          <div className="flex items-center space-x-4">
            <div>🔔</div>
            <div>👤</div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
