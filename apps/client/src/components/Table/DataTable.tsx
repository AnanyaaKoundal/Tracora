"use client";

import React from "react";

export type Column<T> = {
  key: keyof T | "actions";
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  columns,
  data,
  onRowClick, // optional prop
}: {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} className="px-4 py-2 text-left">
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((row, rowIndex) => (
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
            <td
              colSpan={columns.length}
              className="text-center py-4 text-gray-500"
            >
              No data found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
