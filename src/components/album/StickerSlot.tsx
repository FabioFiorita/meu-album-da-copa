import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { slotStyle, type TeamTheme } from "../app/teamVisuals";

export type StickerSlotProps = {
  sectionId: string;
  number: string;
  theme: TeamTheme;
  owned?: boolean;
  duplicateCount?: number;
  missing?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
};

/**
 * The aspect-[3/4] team-colored figurinha slot shared by every tab: the
 * embossed paper slot (`.sticker-slot-lite` + `.sticker-slot-label`) with the
 * country/number label, an owned check, a "Falta" pill when missing and an xN
 * duplicate badge. Renders an interactive <button> when `onClick` is provided,
 * otherwise a static <div>.
 */
export function StickerSlot({
  sectionId,
  number,
  theme,
  owned = false,
  duplicateCount = 0,
  missing = false,
  onClick,
  className,
  ariaLabel,
}: StickerSlotProps) {
  const baseClassName = cn(
    "sticker-slot-lite relative flex aspect-[3/4] w-full overflow-hidden rounded-xl border-2 text-xs font-black leading-none tracking-normal shadow-[var(--app-shadow-sm)]",
    owned && "shadow-[0_0_12px_rgba(53,230,111,0.18)]",
    missing && "border-dashed opacity-100 brightness-[0.72] grayscale-[0.28]",
  );

  const content = (
    <>
      <span aria-hidden="true" className="sticker-slot-label">
        <span>{sectionId}</span>
        <span>{number}</span>
      </span>
      {owned && (
        <span className="absolute right-1 top-1 z-20 flex size-4 items-center justify-center rounded-full bg-[var(--app-success)] text-[var(--app-on-accent)] shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
          <CheckIcon className="size-3" />
        </span>
      )}
      {missing && (
        <span className="absolute inset-x-1 bottom-1 z-20 rounded-full border border-white/22 bg-black/64 py-0.5 text-center text-2xs font-black uppercase leading-none text-[var(--app-on-accent)]">
          Falta
        </span>
      )}
      {duplicateCount > 0 && (
        <span className="absolute bottom-1 right-1 z-20 flex h-5 items-center justify-center rounded-full border border-white/20 bg-black/55 px-1.5 text-2xs font-black text-[var(--app-on-accent)]">
          x{duplicateCount}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        data-section={sectionId}
        data-number={number}
        data-owned={owned ? "true" : "false"}
        style={slotStyle(theme, owned)}
        className={cn(
          baseClassName,
          "touch-manipulation outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--app-on-accent)]",
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      data-section={sectionId}
      data-number={number}
      data-owned={owned ? "true" : "false"}
      style={slotStyle(theme, owned)}
      className={cn(baseClassName, className)}
    >
      {content}
    </div>
  );
}
