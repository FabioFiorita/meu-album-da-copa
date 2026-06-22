import { MinusIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CountStepperProps = {
  count: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min?: number;
  max?: number;
  decrementLabel: string;
  incrementLabel: string;
  className?: string;
};

/**
 * The −/value/+ row used to adjust a sticker count. The − button is an outline
 * control disabled at `min`; the + button is the green (`--app-success`) accent
 * disabled at `max`. Touch-friendly 40px targets with a tabular-nums value.
 */
export function CountStepper({
  count,
  onDecrement,
  onIncrement,
  min = 0,
  max,
  decrementLabel,
  incrementLabel,
  className,
}: CountStepperProps) {
  const decrementDisabled = count <= min;
  const incrementDisabled = max != null && count >= max;

  return (
    <div className={cn("flex shrink-0 items-center gap-1", className)}>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-10 rounded-xl border-[var(--app-border)] bg-[var(--app-button-muted)] text-[var(--app-text)] hover:bg-[var(--app-button-muted-hover)] hover:text-[var(--app-text)]"
        aria-label={decrementLabel}
        disabled={decrementDisabled}
        onClick={onDecrement}
      >
        <MinusIcon className="size-4" />
      </Button>
      <span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-field-bg)] px-2 text-sm font-black text-[var(--app-text)] tabular-nums">
        {count}
      </span>
      <Button
        type="button"
        size="icon"
        className="size-10 rounded-xl border-transparent bg-[var(--app-success)] text-[var(--app-on-accent)] shadow-none hover:bg-[var(--app-success-strong)]"
        aria-label={incrementLabel}
        disabled={incrementDisabled}
        onClick={onIncrement}
      >
        <PlusIcon className="size-4" />
      </Button>
    </div>
  );
}
