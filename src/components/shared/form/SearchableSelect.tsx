"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  /** A second line, e.g. a phone number. It is searchable too. */
  description?: string;
  /** Extra terms that should find this option without being shown. */
  keywords?: string[];
}

interface SearchableSelectProps {
  id?: string;
  /** "" means nothing is picked. */
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  /** While the list is still loading, say so instead of "no results". */
  loading?: boolean;
  /** Offer a way back to "nothing picked", for optional fields. */
  clearable?: boolean;
  invalid?: boolean;
  className?: string;
}

/** Separates what a search may match from the id kept only for uniqueness. */
const ID_SEPARATOR = "␟";
const CLEAR_VALUE = "__clear__";

/**
 * Every typed word must appear somewhere in the option — plain "contains",
 * not cmdk's default fuzzy scoring. Fuzzy matching let five phone digits match
 * any number that merely contained them in order, which for a large customer
 * book lists hundreds of rows for one intended person. The id is left out:
 * uuids are hex, so "a" would otherwise match everyone.
 */
export const matchesSearch = (value: string, search: string, keywords?: string[]) => {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (value === CLEAR_VALUE) return words.length === 0 ? 1 : 0;
  if (words.length === 0) return 1;
  const searchable = `${value.split(ID_SEPARATOR)[0]} ${(keywords ?? []).join(" ")}`.toLowerCase();
  return words.every((word) => searchable.includes(word)) ? 1 : 0;
};

/**
 * A select you can type into.
 *
 * For lists that grow with the business — customers, suppliers, airlines,
 * routes, employees. A plain select made an agency with hundreds of customers
 * scroll through all of them to sell one ticket. Typing matches the label and
 * the description, so a customer can be found by name or by phone.
 */
const SearchableSelect = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Search…",
  emptyText = "No match.",
  disabled,
  loading,
  clearable,
  invalid,
  className,
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  return (
    // modal: inside a Dialog, a non-modal popover's list cannot be scrolled
    // with the wheel, because the dialog locks scrolling outside itself.
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "w-full justify-between px-3 font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="min-w-0 truncate text-left">
            {selected ? (
              <>
                {selected.label}
                {selected.description && (
                  <span className="ml-2 text-muted-foreground">{selected.description}</span>
                )}
              </>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command filter={matchesSearch}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{loading ? "Loading…" : emptyText}</CommandEmpty>
            <CommandGroup>
              {clearable && selected && (
                <CommandItem
                  // matchesSearch shows this only before a search starts.
                  value={CLEAR_VALUE}
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                  Clear selection
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  // cmdk treats equal values as one item, so the id is appended —
                  // two customers can share a name — after a separator that
                  // matchesSearch never looks past.
                  value={`${option.label} ${option.description ?? ""}${ID_SEPARATOR}${option.value}`}
                  keywords={option.keywords}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("size-4", option.value === value ? "opacity-100" : "opacity-0")}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.description && (
                    <span className="shrink-0 text-xs text-muted-foreground">{option.description}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableSelect;
