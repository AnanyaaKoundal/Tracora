'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { logout } from '@/actions/loginAction';
import { useRouter } from 'next/navigation';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void; }) {
  const router = useRouter();
  const handleLogout = async () => {
    const res = await logout();
    if (res.success) {
      router.push("/"); // redirect to homepage/login
    } else {
      console.error(res.message);
    }
  };
  return (
    <div className='flex'>
      {/* Hamburger button - always visible */}
      <button
        className="p-4 z-50 fixed  left-2 text-primary focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className='flex space-x-4 items-center'>

        <Menu size={24} /> 
        <div className="text-lg font-bold ">Tracora</div>
        </div>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed pt-16 left-0 h-full w-64 bg-white/40 text-black z-40 shadow-lg
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          transition-transform duration-300 ease-in-out
        `}
      >
        <nav className="space-y-2">
          <a href="/dashboard" className="block hover:bg-primary/60 p-2 rounded pl-8">
            Dashboard
          </a>
          <a href="/projects" className="block hover:bg-primary/60 p-2 rounded pl-8">
            Projects
          </a>
          <a href="/bugs" className="block hover:bg-primary/60 p-2 rounded pl-8">
            Bugs
          </a>
          <button
            onClick={handleLogout}
            className="block w-full text-left hover:bg-primary/60 p-2 rounded pl-8"
          >
            Logout
          </button>
        </nav>
      </aside>
    </div>
  );
}
