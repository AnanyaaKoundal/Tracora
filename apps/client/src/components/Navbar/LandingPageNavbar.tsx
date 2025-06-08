'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";

export default function Navbar() {
  const [year, setYear] = useState<number>(new Date().getFullYear());

  return (
    <nav className="flex justify-between items-center px-8 py-4 shadow">
        <div className="text-xl font-bold text-indigo-600">Tracora</div>
        <div className="space-x-6">
          <a href="#about" className="hover:text-indigo-600">About</a>
          <a href="#details" className="hover:text-indigo-600">Details</a>
          <a href="#use" className="hover:text-indigo-600">Use</a>
          <a href="#contact" className="hover:text-indigo-600">Contact</a>
          <Link href="/auth/signup">
            <button className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Try Now
            </button>
          </Link>
        </div>
      </nav>
  );
}
