'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void; }) {

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
          <a href="/" className="block hover:bg-primary/60 p-2 rounded pl-8">
            Logout
          </a>
        </nav>
      </aside>
    </div>
  );
}
