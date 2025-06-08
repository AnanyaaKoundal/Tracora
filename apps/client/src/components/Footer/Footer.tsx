'use client';

import { useEffect, useState } from 'react';

export default function Footer() {
  const [year, setYear] = useState<number>(new Date().getFullYear());

  return (
    <footer className="text-center text-gray-500 py-6 border-t">
      &copy; {year} Tracora. All rights reserved.
    </footer>
  );
}
