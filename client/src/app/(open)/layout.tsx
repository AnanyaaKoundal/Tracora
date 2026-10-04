import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Tracora",
  description: "Multi-tenant bug tracker with a cited AI assistant.",
};

export default function OpenLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
