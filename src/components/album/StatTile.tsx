import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatTileProps = {
  label: string;
  value: ReactNode;
  className?: string;
};

/**
 * The small centered label + value stat used in the album detail header. Colors
 * come straight from the `--app-*` tokens (muted label, gold-accent value), so it
 * reads correctly in both themes without any theme-specific CSS overrides.
 */
export function StatTile({ label, value, className }: StatTileProps) {
  return (
    <div className={cn("min-w-0 text-center", className)}>
      <p className="album-detail-stat-label truncate text-2xs font-black leading-none text-[var(--app-muted-text)]">
        {label}
      </p>
      <p className="album-detail-stat-value mt-3 text-lg font-black leading-none text-[var(--app-gold-accent)] tabular-nums">
        {value}
      </p>
    </div>
  );
}
