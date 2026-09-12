"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableSearchProps {
  /** The term currently in the URL. Treated as the source of truth. */
  initialValue?: string;
  placeholder?: string;
  debounceMs?: number;
  onDebouncedChange: (value: string) => void;
}

const DataTableSearch = ({
  initialValue = "",
  placeholder = "Search...",
  debounceMs = 700,
  onDebouncedChange,
}: DataTableSearchProps) => {
  const [value, setValue] = useState(initialValue);

  /**
   * Resync when `initialValue` changes from outside this input — a cleared
   * filter chip, or the browser back button.
   *
   * Adjusted during render rather than in an effect: React re-runs the
   * component immediately with the new state and discards the in-progress
   * pass, so there is no extra commit. Storing the previous prop in state is
   * the documented way to do this.
   */
  const [lastSyncedValue, setLastSyncedValue] = useState(initialValue);
  if (initialValue !== lastSyncedValue) {
    setLastSyncedValue(initialValue);
    setValue(initialValue);
  }

  useEffect(() => {
    // Already what the URL holds, so there is nothing to push. This is what
    // stops an external resync (or typing and deleting back to the start) from
    // firing a pointless server refresh — no ref bookkeeping needed.
    if (value === initialValue) return;

    const timer = setTimeout(() => onDebouncedChange(value), debounceMs);
    return () => clearTimeout(timer);
  }, [value, initialValue, debounceMs, onDebouncedChange]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      <Input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        // A placeholder is not an accessible name — it disappears on input.
        aria-label={placeholder}
        className="pr-9 pl-9"
      />

      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          // Clearing skips the debounce: waiting 700ms after an explicit clear
          // feels broken. The effect above then sees value === initialValue and
          // stays quiet.
          onClick={() => {
            setValue("");
            onDebouncedChange("");
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground"
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
};

export default DataTableSearch;
