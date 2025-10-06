"use client";

import React, { useState } from "react";

export type Column<T> = {
  key: keyof T | "actions";
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean; // new
};

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  filters,
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  filters?: React.ReactNode; // new
}) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: "asc" | "desc" } | null>(null);

  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // sort data if needed
  let sortedData = [...data];
  if (sortConfig) {
    sortedData.sort((a, b) => {
      const valA = (a as any)[sortConfig.key];
      const valB = (b as any)[sortConfig.key];
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  return (
    <div className="space-y-3">
      {filters && <div className="flex gap-4">{filters}</div>} {/* 👈 filters above table */}

      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-2 text-left ${col.sortable ? "cursor-pointer select-none" : ""}`}
                onClick={() => col.sortable && handleSort(col.key as keyof T)}
              >
                {col.header}
                {col.sortable && sortConfig?.key === col.key && (
                  <span className="ml-1">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length > 0 ? (
            sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-t ${
                  onRowClick ? "cursor-pointer hover:bg-gray-100 transition-colors" : ""
                }`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-2">
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                No data found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
