// app/layout.tsx
import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Bug Tracker | Landing",
  description: "Track and manage your software bugs with ease",
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
      </body>
    </html>
  );
}
