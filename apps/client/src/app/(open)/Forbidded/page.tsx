"use client";

import { useRouter } from "next/navigation";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold text-red-500">403 - Forbidden</h1>
      <p className="mt-2 text-gray-600">You are not authorized to view this page.</p>
      <button
        className="mt-4 px-4 py-2 bg-primary text-white rounded"
        onClick={() => router.push("/")}
      >
        Go Home
      </button>
    </div>
  );
}
