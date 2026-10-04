import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Tracora",
  description: "Multi-tenant bug tracker with a cited AI assistant.",
  icons: { icon: "/logo-tracora.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="bottom-right" /> 
      </body>
    </html>
  );
}

export const dynamic = 'force-dynamic';
