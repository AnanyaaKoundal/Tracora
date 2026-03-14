"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, X, Filter, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type Column<T> = {
  key: keyof T | "actions";
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
};

export type FilterConfig = {
  key: string;
  label: string;
  type: "select" | "text" | "date" | "daterange" | "multiselect";
  options?: { value: string; label: string }[];
  placeholder?: string;
};

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
  enableSearch?: boolean;
  enableFilters?: boolean;
  searchableFields?: (keyof T)[];
  filterFields?: FilterConfig[];
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  pageSize = 10,
  enableSearch = false,
  enableFilters = false,
  searchableFields,
  filterFields = [],
}: DataTableProps<T> & { columns: Column<T>[]; data: T[] }) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: "asc" | "desc" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[] | { start: string; end: string }>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Get searchable fields - default to all keys if not specified
  const fieldsToSearch = useMemo(() => {
    if (searchableFields && searchableFields.length > 0) {
      return searchableFields;
    }
    return columns.map(col => col.key).filter(key => key !== "actions") as (keyof T)[];
  }, [searchableFields, columns]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row => 
        fieldsToSearch.some(field => {
          const value = row[field];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (!value || (typeof value === "string" && value === "all") || (Array.isArray(value) && value.length === 0)) {
        return;
      }

      result = result.filter(row => {
        const rowValue = row[key];

        // Get filter config for this key
        const filterConfig = filterFields.find(f => f.key === key);
        if (!filterConfig) return true;

        switch (filterConfig.type) {
          case "select":
          case "text":
            if (typeof value === "string") {
              return String(rowValue).toLowerCase().includes(value.toLowerCase());
            }
            break;

          case "daterange":
            if (typeof value === "object" && value !== null && "start" in value && "end" in value) {
              const rowDate = new Date(String(rowValue));
              const startDate = value.start ? new Date(value.start) : null;
              const endDate = value.end ? new Date(value.end) : null;
              
              if (startDate && rowDate < startDate) return false;
              if (endDate && rowDate > endDate) return false;
              return true;
            }
            break;

          case "multiselect":
            if (Array.isArray(value)) {
              const rowValueStr = String(rowValue).toLowerCase();
              return value.some(v => rowValueStr === v.toLowerCase());
            }
            break;
        }
        return true;
      });
    });

    return result;
  }, [data, searchQuery, activeFilters, fieldsToSearch, filterFields]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    let result = [...filteredData];
    
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key as string];
        const valB = b[sortConfig.key as string];
        
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [filteredData, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when data/filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters, data.length]);

  const handleSort = (key: keyof T) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const handleFilterChange = (key: string, value: string | string[] | { start: string; end: string }) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
  };

  const hasActiveFilters = searchQuery.trim() || Object.values(activeFilters).some(v => {
    if (!v) return false;
    if (typeof v === "string") return v && v !== "all";
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && "start" in v) return v.start || v.end;
    return false;
  });

  const activeFilterCount = Object.values(activeFilters).filter(v => {
    if (!v) return false;
    if (typeof v === "string") return v && v !== "all";
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && v !== null && "start" in v) return v.start || v.end;
    return false;
  }).length;

  // Render filter input based on type
  const renderFilterInput = (filter: FilterConfig) => {
    const value = activeFilters[filter.key];
    const currentValue = typeof value === "string" ? value : "";

    switch (filter.type) {
      case "select":
        return (
          <select
            value={currentValue}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="h-9 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All {filter.label}s</option>
            {filter.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "text":
        return (
          <Input
            type="text"
            placeholder={`Filter by ${filter.label.toLowerCase()}`}
            value={currentValue}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="h-9"
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={currentValue}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="h-9"
          />
        );

      case "daterange":
        const dateRange = typeof value === "object" && value !== null ? value as { start: string; end: string } : { start: "", end: "" };
        return (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleFilterChange(filter.key, { ...dateRange, start: e.target.value })}
              className="h-9 w-36"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleFilterChange(filter.key, { ...dateRange, end: e.target.value })}
              className="h-9 w-36"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {(enableSearch || enableFilters) && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Search */}
          {enableSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-10 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Filter Toggle */}
          {enableFilters && filterFields.length > 0 && (
            <Button
              variant={showFilters || activeFilterCount > 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white text-primary rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}

          {/* Results Count */}
          <div className="ml-auto text-sm text-muted-foreground">
            {sortedData.length === data.length ? (
              <span>{sortedData.length} {sortedData.length === 1 ? 'result' : 'results'}</span>
            ) : (
              <span>{sortedData.length} of {data.length} results</span>
            )}
          </div>
        </div>
      )}

      {/* Filter Dropdowns */}
      {enableFilters && showFilters && filterFields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border border-gray-200 items-end"
        >
          {filterFields.map(field => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {field.label}
              </label>
              {renderFilterInput(field)}
            </div>
          ))}
        </motion.div>
      )}

      {/* Table Container */}
      <div className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-white border-b border-gray-200">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-3.5 text-left text-sm font-bold text-slate-800 tracking-wide uppercase ${
                      col.sortable ? "cursor-pointer select-none hover:bg-slate-100 transition-colors" : ""
                    }`}
                    onClick={() => col.sortable && handleSort(col.key as keyof T)}
                  >
                    <div className="flex items-center gap-2">
                      {col.header}
                      {col.sortable && (
                        <span className="text-gray-400">
                          {sortConfig?.key === col.key ? (
                            sortConfig.direction === "asc" ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )
                          ) : (
                            <div className="w-4 h-4 flex flex-col opacity-30">
                              <ChevronUp className="w-3 h-3 -mb-1" />
                              <ChevronDown className="w-3 h-3" />
                            </div>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/50">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <motion.tr
                    key={rowIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: rowIndex * 0.02 }}
                    className={`${
                      onRowClick 
                        ? "cursor-pointer hover:bg-primary/5 transition-colors" 
                        : "hover:bg-blue-50/80 transition-colors"
                    } ${rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="px-4 py-3 text-sm text-slate-700">
                        {col.render ? col.render(row) : String(row[col.key as string] ?? '-')}
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        {hasActiveFilters ? <Filter className="w-6 h-6 text-gray-400" /> : <Search className="w-6 h-6 text-gray-400" />}
                      </div>
                      <p>{hasActiveFilters ? "No matching results found" : "No data available"}</p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-primary hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? "bg-primary text-white"
                        : "hover:bg-gray-100 text-muted-foreground"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
