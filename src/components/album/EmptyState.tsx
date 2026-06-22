import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  icon: LucideIcon;
  title?: string;
  description: string;
  action?: ReactNode;
};

/**
 * Centered gold-bordered empty/placeholder card with a gold icon tile, an
 * optional title, a description and an optional action below.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-[var(--app-radius-xl)] border-2 border-[var(--app-border-strong)] bg-[var(--app-surface)] px-5 py-8 text-center shadow-[var(--app-shadow-lg)]">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-gold)] text-[var(--app-gold-accent)]">
        <Icon className="size-7" />
      </div>
      {title && (
        <h2 className="mt-4 text-lg font-semibold leading-tight text-[var(--app-text)]">
          {title}
        </h2>
      )}
      <p
        className={cn(
          "mx-auto max-w-[280px] text-sm font-semibold leading-relaxed text-[var(--app-muted-text)]",
          title ? "mt-2" : "mt-4",
        )}
      >
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
