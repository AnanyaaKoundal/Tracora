"use client";

import { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";

export type Column<T> = {
  key: keyof T | "actions";
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
};

export function DataTable<T>({ columns, data }: { columns: Column<T>[]; data: T[] }) {
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
        {data.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-t">
            {columns.map((col, colIndex) => (
              <td key={colIndex} className="px-4 py-2">
                {col.render ? col.render(row) : (row as any)[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
