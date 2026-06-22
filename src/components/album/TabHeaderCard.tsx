import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TabHeaderCardProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * The gold-bordered header card that opens each tab: a gold icon tile, a title,
 * an optional subtitle (any ReactNode — e.g. count + percentage) and an
 * optional right-aligned action slot (share menu, badge, etc.).
 */
export function TabHeaderCard({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
}: TabHeaderCardProps) {
  return (
    <section
      className={cn(
        "rounded-[var(--app-radius-xl)] border-2 border-[var(--app-border)] bg-[var(--app-card)] p-4 shadow-[var(--app-shadow-lg)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-gold)] text-[var(--app-gold-accent)]">
          <Icon className="size-6" />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="truncate text-lg font-semibold leading-tight tracking-normal text-[var(--app-text)]">
            {title}
          </h1>
          {subtitle != null && (
            <div className="mt-1 text-sm font-semibold text-[var(--app-muted-text)]">
              {subtitle}
            </div>
          )}
        </div>
        {action != null && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
