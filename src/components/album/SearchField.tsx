import { SearchIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SearchFieldProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * The gold-bordered h-14 search row with a leading search icon. Calls
 * `onChange` with the raw input string.
 */
export function SearchField({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
}: SearchFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label
          htmlFor={id}
          className="pl-1 text-sm font-black leading-none tracking-normal text-[var(--app-text)]"
        >
          {label}
        </label>
      )}
      <div className="flex h-14 items-center gap-3 rounded-2xl border-2 border-[var(--app-border-strong)] bg-[var(--app-surface)] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <SearchIcon className="size-5 shrink-0 text-[var(--app-gold-accent)]" />
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-text)]"
        />
      </div>
    </div>
  );
}
