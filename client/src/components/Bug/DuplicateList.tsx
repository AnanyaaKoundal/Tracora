"use client";

import { AlertTriangle } from "lucide-react";
import type { DuplicateMatch } from "@/services/aiService";

interface Props {
  matches: DuplicateMatch[];
  onOpenBug: (bugId: string) => void;
}

export default function DuplicateList({ matches, onOpenBug }: Props) {
  if (matches.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-500/30">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          Possible duplicate
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {matches.length} found
        </span>
      </div>

      <div className="divide-y divide-amber-500/20">
        {matches.map((match) => (
          <button
            key={match.bug_id}
            type="button"
            onClick={() => onOpenBug(match.bug_id)}
            className="w-full grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 text-left text-sm hover:bg-amber-500/10 transition-colors"
          >
            <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
              {match.bug_id}
            </span>
            <span className="truncate">{match.title ?? "Untitled bug"}</span>
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className="hidden sm:inline h-1.5 w-16 rounded-full bg-amber-500/20 overflow-hidden">
                <span
                  className="block h-full bg-amber-500"
                  style={{ width: `${Math.round(match.score * 100)}%` }}
                />
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {Math.round(match.score * 100)}%
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
