'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Button } from '../ui/button';

export default function Navbar() {
  const [year, setYear] = useState<number>(new Date().getFullYear());

  return (
    <header className="absolute top-0 left-0 w-full px-8 py-6 flex justify-between items-center z-10">
        <div className="text-xl font-bold text-primary">Tracora</div>
        <nav className="space-x-6 text-gray-800 font-medium">
          <a href="#features" className="hover:text-primary">Features</a>
          <a href="#about" className="hover:text-primary">About</a>
          <a href="#contact" className="hover:text-primary">Contact</a>
          <Link href="/auth/login" passHref>
          <Button variant="default" className="ml-4">
            Login
          </Button>
        </Link>
        </nav>
      </header>
  );
}
