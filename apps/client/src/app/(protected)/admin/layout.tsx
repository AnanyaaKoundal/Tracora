"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import jwt from "jsonwebtoken";

interface Props {
  children: ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    try {
      const payload = jwt.decode(token) as { role?: string };
      if (payload?.role === "admin") {
        setAuthorized(true);
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      console.error("JWT decode failed", err);
      router.replace("/auth/login");
    }
  }, [router]);

  if (!authorized) {
    return <p>Checking permissions...</p>;
  }

  return <>{children}</>;
}
