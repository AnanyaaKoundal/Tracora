"use client";

import { useEffect, useState } from "react";
import { Bug } from "@/schemas/bug.schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  checkDuplicatesService,
  suggestTitleService,
  type DuplicateMatch,
} from "@/services/aiService";
import DuplicateList from "./DuplicateList";

interface Props {
  bug: Bug;
  setBug: React.Dispatch<React.SetStateAction<Bug | null>>;
  onOpenBug: (bugId: string) => void;
  onDuplicateCountChange: (count: number) => void;
}

const MIN_DESCRIPTION_LENGTH = 15;
const DUPLICATE_DEBOUNCE_MS = 1200;

export default function CreateBugForm({
  bug,
  setBug,
  onOpenBug,
  onDuplicateCountChange,
}: Props) {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [checking, setChecking] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState<string | null>(null);

  const description = bug.bug_description;

  useEffect(() => {
    onDuplicateCountChange(duplicates.length);
  }, [duplicates.length]);

  useEffect(() => {
    const text = (description ?? "").trim();
    setDuplicates([]);
    setSuggestedTitle(null);

    if (text.length < MIN_DESCRIPTION_LENGTH) return;

    let cancelled = false;
    setChecking(true);

    const timer = setTimeout(async () => {
      try {
        const res = await checkDuplicatesService(text);
        if (!cancelled) setDuplicates(res.matches ?? []);
      } catch {
        if (!cancelled) setDuplicates([]);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, DUPLICATE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [description]);

  async function handleSuggestTitle() {
    const text = (description ?? "").trim();
    if (!text) {
      toast.error("Write a description first");
      return;
    }

    setSuggesting(true);
    try {
      const res = await suggestTitleService(text);
      setSuggestedTitle(res.title);
    } catch {
      toast.error("Could not generate a title suggestion");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-muted-foreground">Title</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSuggestTitle}
            disabled={suggesting}
            className="h-7 gap-1.5 text-xs text-primary"
          >
            {suggesting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3" />
            )}
            Suggest title
          </Button>
        </div>

        <Input
          type="text"
          value={bug.bug_name}
          onChange={(e) =>
            setBug((prev) => (prev ? { ...prev, bug_name: e.target.value } : prev))
          }
          placeholder="Short, specific summary of the problem"
          className="text-xl font-semibold bg-transparent border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
        />

        {suggestedTitle && (
          <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
            <Wand2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              Suggested:{" "}
              <span className="text-foreground font-medium">{suggestedTitle}</span>
            </span>
            <div className="ml-auto flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBug((prev) =>
                    prev ? { ...prev, bug_name: suggestedTitle } : prev
                  );
                  setSuggestedTitle(null);
                }}
                className="h-6 px-2 text-xs"
              >
                Apply
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSuggestedTitle(null)}
                className="h-6 px-2 text-xs text-muted-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Description
        </Label>
        <Textarea
          className="min-h-[180px] resize-none bg-muted/30"
          value={bug.bug_description}
          onChange={(e) =>
            setBug((prev) =>
              prev ? { ...prev, bug_description: e.target.value } : prev
            )
          }
          placeholder="Add a description..."
        />
      </div>

      {/* Duplicates */}
      {checking && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Search className="w-3 h-3 animate-pulse" />
          Checking for similar bugs...
        </div>
      )}

      {!checking && duplicates.length > 0 && (
        <DuplicateList matches={duplicates} onOpenBug={onOpenBug} />
      )}
    </div>
  );
}
