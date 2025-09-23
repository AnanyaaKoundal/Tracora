// components/AdminPanel/Dashboard/StatsCircle.tsx
"use client";

interface StatsCircleProps {
  label: string;
  value: number;
}

export default function StatsCircle({ label, value }: StatsCircleProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className="
          flex items-center justify-center 
          w-24 h-24 md:w-28 md:h-28 
          rounded-full 
          bg-white 
          text-2xl md:text-3xl font-extrabold text-gray-800
          relative
        "
        style={{
          boxShadow: "6px 6px 12px rgba(0,0,0,0.08)", // subtle uplift shadow
        }}
      >
        {value}
      </div>
      <span className="mt-3 text-sm font-medium text-gray-600 text-center">
        {label}
      </span>
    </div>
  );
}
