import { cn } from "@/lib/utils";

export type ProgressBarProps = {
  value: number;
  className?: string;
  trackClassName?: string;
};

/**
 * Token-themed progress bar: a rounded track with an `--app-progress-gradient`
 * fill clamped to 0–100%. Pass `trackClassName` (or `className`) to tweak the
 * track height / border in context (e.g. `h-1.5` for the compact section bar).
 */
export function ProgressBar({
  value,
  className,
  trackClassName,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-3 overflow-hidden rounded-full border border-[var(--app-border-strong)] bg-[var(--app-scrim)]",
        trackClassName,
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width]"
        style={{
          width: `${pct}%`,
          backgroundImage: "var(--app-progress-gradient)",
        }}
      />
    </div>
  );
}
