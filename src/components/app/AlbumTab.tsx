import { useMutation, useQuery } from "convex/react";
import {
  BookOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  ClipboardIcon,
  SearchIcon,
  TrophyIcon,
} from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { AlbumSession } from "@/lib/albumSession";
import { errorMessage } from "@/lib/errors";
import { WC_2026_TEMPLATE } from "@convex/lib/templates";
import { cn } from "@/lib/utils";
import { TeamBackgroundForms } from "./TeamBackgroundForms";
import { CocaColaIcon } from "./teamVisuals";

type Props = { session: AlbumSession };
type SectionTemplate = (typeof WC_2026_TEMPLATE.sections)[number];
type TeamTheme = {
  primary: string;
  secondary: string;
  accent: string;
  slot?: string;
  paper?: string;
  ink?: string;
};
type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

const DEFAULT_OPEN_SECTIONS: string[] = [];
const PANEL_ANIMATION_MS = 150;
const DEFAULT_TEAM_THEME: TeamTheme = {
  primary: "#1f7a3a",
  secondary: "#0f4f2a",
  accent: "#f6e37a",
};
const SPECIAL_THEME: TeamTheme = {
  primary: "#111111",
  secondary: "#2a2111",
  accent: "#d6b45d",
  paper: "#fff3d0",
  ink: "#2b2415",
};
const TEAM_THEMES: Record<string, TeamTheme> = {
  FWC: SPECIAL_THEME,
  CC: SPECIAL_THEME,
  CAN: { primary: "#d80621", secondary: "#f5f5f5", accent: "#d80621", slot: "#d80621" },
  MEX: { primary: "#006847", secondary: "#ffffff", accent: "#ce1126", slot: "#006847" },
  USA: { primary: "#002868", secondary: "#bf0a30", accent: "#ffffff", slot: "#002868" },
  BRA: { primary: "#009b3a", secondary: "#ffdf00", accent: "#002776", slot: "#4f9b55" },
  ARG: { primary: "#75aadb", secondary: "#ffffff", accent: "#f6b40e", slot: "#75aadb" },
  FRA: { primary: "#0055a4", secondary: "#ffffff", accent: "#ef4135", slot: "#0055a4" },
  ENG: { primary: "#ffffff", secondary: "#cf142b", accent: "#cf142b", slot: "#cf142b" },
  GER: { primary: "#000000", secondary: "#dd0000", accent: "#ffce00", slot: "#dd0000" },
  ESP: { primary: "#aa151b", secondary: "#f1bf00", accent: "#aa151b", slot: "#aa151b" },
  POR: { primary: "#006600", secondary: "#ff0000", accent: "#ffcc00", slot: "#006600" },
  NED: { primary: "#ff7f00", secondary: "#21468b", accent: "#ffffff", slot: "#ff7f00" },
  BEL: { primary: "#000000", secondary: "#ffd90c", accent: "#ef3340", slot: "#000000" },
  ITA: { primary: "#009246", secondary: "#ffffff", accent: "#ce2b37", slot: "#009246" },
  CRO: { primary: "#f00000", secondary: "#ffffff", accent: "#171796", slot: "#f00000" },
  URU: { primary: "#0038a8", secondary: "#ffffff", accent: "#fcd116", slot: "#0038a8" },
  COL: { primary: "#fcd116", secondary: "#003893", accent: "#ce1126", slot: "#003893" },
  MAR: { primary: "#c1272d", secondary: "#006233", accent: "#006233", slot: "#c1272d" },
  JPN: { primary: "#ffffff", secondary: "#bc002d", accent: "#bc002d", slot: "#bc002d" },
  KOR: { primary: "#ffffff", secondary: "#c60c30", accent: "#003478", slot: "#003478" },
  AUS: { primary: "#00247d", secondary: "#00843d", accent: "#ffcd00", slot: "#00247d" },
  IRN: { primary: "#239f40", secondary: "#ffffff", accent: "#da0000", slot: "#239f40" },
  KSA: { primary: "#006c35", secondary: "#0b8b49", accent: "#ffffff", slot: "#006c35" },
  QAT: { primary: "#8a1538", secondary: "#ffffff", accent: "#8a1538", slot: "#8a1538" },
  SEN: { primary: "#00853f", secondary: "#fdef42", accent: "#e31b23", slot: "#00853f" },
  EGY: { primary: "#ce1126", secondary: "#ffffff", accent: "#000000", slot: "#ce1126" },
  NGA: { primary: "#008751", secondary: "#ffffff", accent: "#008751", slot: "#008751" },
  GHA: { primary: "#ce1126", secondary: "#fcd116", accent: "#006b3f", slot: "#ce1126" },
  CIV: { primary: "#f77f00", secondary: "#ffffff", accent: "#009e60", slot: "#f77f00" },
  CMR: { primary: "#007a5e", secondary: "#ce1126", accent: "#fcd116", slot: "#007a5e" },
  RSA: { primary: "#007a4d", secondary: "#ffb612", accent: "#002395", slot: "#007a4d" },
  TUN: { primary: "#e70013", secondary: "#ffffff", accent: "#e70013", slot: "#e70013" },
  ALG: { primary: "#006233", secondary: "#ffffff", accent: "#d21034", slot: "#006233" },
  ECU: { primary: "#ffdd00", secondary: "#034ea2", accent: "#ed1c24", slot: "#034ea2" },
  PAR: { primary: "#d52b1e", secondary: "#ffffff", accent: "#0038a8", slot: "#d52b1e" },
  CHI: { primary: "#0039a6", secondary: "#ffffff", accent: "#d52b1e", slot: "#0039a6" },
  PER: { primary: "#d91023", secondary: "#ffffff", accent: "#d91023", slot: "#d91023" },
  VEN: { primary: "#ffcc00", secondary: "#00247d", accent: "#cf142b", slot: "#00247d" },
  BOL: { primary: "#d52b1e", secondary: "#f9e300", accent: "#007934", slot: "#007934" },
  JAM: { primary: "#009b3a", secondary: "#fed100", accent: "#000000", slot: "#009b3a" },
  CRC: { primary: "#002b7f", secondary: "#ffffff", accent: "#ce1126", slot: "#002b7f" },
  PAN: { primary: "#005293", secondary: "#ffffff", accent: "#d21034", slot: "#005293" },
  HON: { primary: "#00a3e0", secondary: "#ffffff", accent: "#00a3e0", slot: "#00a3e0" },
  CZE: { primary: "#11457e", secondary: "#ffffff", accent: "#d7141a", slot: "#11457e" },
  POL: { primary: "#dc143c", secondary: "#ffffff", accent: "#dc143c", slot: "#dc143c" },
  SRB: { primary: "#c6363c", secondary: "#0c4076", accent: "#ffffff", slot: "#c6363c" },
  SUI: { primary: "#d52b1e", secondary: "#f5f5f5", accent: "#ffffff", slot: "#d52b1e" },
  DEN: { primary: "#c60c30", secondary: "#ffffff", accent: "#ffffff", slot: "#c60c30" },
  SCO: { primary: "#005eb8", secondary: "#ffffff", accent: "#ffffff", slot: "#005eb8" },
  WAL: { primary: "#00a650", secondary: "#ffffff", accent: "#c8102e", slot: "#00a650" },
  IRL: { primary: "#169b62", secondary: "#ffffff", accent: "#ff883e", slot: "#169b62" },
};

function getTheme(sectionId: string) {
  return TEAM_THEMES[sectionId] ?? DEFAULT_TEAM_THEME;
}

function sectionStyle(theme: TeamTheme): ThemeStyle {
  return {
    "--team-primary": theme.primary,
    "--team-secondary": theme.secondary,
    "--team-accent": theme.accent,
    backgroundColor: theme.primary,
    borderColor: theme.accent,
  };
}

function slotStyle(theme: TeamTheme, owned: boolean): ThemeStyle {
  const slotColor = theme.slot ?? theme.primary;
  return {
    "--slot-paper": theme.paper ?? "#fff4fb",
    "--slot-ink": theme.ink ?? "#4d5360",
    backgroundColor: slotColor,
    borderColor: owned ? theme.accent : "rgba(255, 255, 255, 0.34)",
  };
}

function SectionIcon({ section }: { section: SectionTemplate }) {
  if (section.id === "FWC") {
    return <TrophyIcon className="size-4 text-[#ffd65c]" />;
  }

  if (section.id === "CC") {
    return <CocaColaIcon />;
  }

  return (
    <img
      src={`/flags/${section.id}.svg`}
      alt=""
      aria-hidden="true"
      className="size-full rounded-full object-cover"
      loading="lazy"
    />
  );
}

export function AlbumTab({ session }: Props) {
  const snapshot = useQuery(api.albums.getPrivateSnapshot, {
    code: session.code,
    writeKey: session.writeKey,
  });
  const addCopies = useMutation(api.stickers.addCopies);
  const [q, setQ] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>(DEFAULT_OPEN_SECTIONS);
  const [closingSections, setClosingSections] = useState<string[]>([]);
  const closeTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(closeTimers.current).forEach(window.clearTimeout);
    };
  }, []);

  const countByKey = useMemo(() => {
    const m = new Map<string, number>();
    if (!snapshot) return m;
    for (const s of snapshot.stickers) {
      m.set(s.key, s.count);
    }
    return m;
  }, [snapshot]);

  const filteredSections = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return WC_2026_TEMPLATE.sections;
    return WC_2026_TEMPLATE.sections.filter(
      (s) =>
        s.id.toLowerCase().includes(qq) ||
        s.title.toLowerCase().includes(qq),
    );
  }, [q]);

  async function applyDelta(key: string, delta: number) {
    try {
      await addCopies({
        code: session.code,
        writeKey: session.writeKey,
        stickerKey: key,
        delta,
      });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  function toggleSection(sectionId: string) {
    const isOpen = openSections.includes(sectionId);

    if (isOpen) {
      setOpenSections((current) => current.filter((id) => id !== sectionId));
      setClosingSections((current) =>
        current.includes(sectionId) ? current : [...current, sectionId],
      );

      if (closeTimers.current[sectionId]) {
        window.clearTimeout(closeTimers.current[sectionId]);
      }

      closeTimers.current[sectionId] = window.setTimeout(() => {
        setClosingSections((current) =>
          current.filter((id) => id !== sectionId),
        );
        delete closeTimers.current[sectionId];
      }, PANEL_ANIMATION_MS);
      return;
    }

    if (closeTimers.current[sectionId]) {
      window.clearTimeout(closeTimers.current[sectionId]);
      delete closeTimers.current[sectionId];
    }

    setClosingSections((current) => current.filter((id) => id !== sectionId));
    setOpenSections((current) =>
      current.includes(sectionId) ? current : [...current, sectionId],
    );
  }

  if (snapshot === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-24 pt-4">
        <Skeleton className="h-28 rounded-3xl bg-[#171717]" />
        <Skeleton className="h-14 rounded-2xl bg-[#171717]" />
        <Skeleton className="h-80 rounded-3xl bg-[#171717]" />
      </div>
    );
  }

  const { album } = snapshot;
  const completion = Math.max(0, Math.min(100, album.completionPercentage));
  const openSticker =
    openKey == null
      ? null
      : WC_2026_TEMPLATE.sections
          .flatMap((s) => s.stickers)
          .find((x) => x.key === openKey) ?? null;
  const openCount = openKey ? countByKey.get(openKey) ?? 0 : 0;

  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-24 pt-4">
      <section className="rounded-[1.35rem] border-2 border-[#d6b45d] bg-[#1b1b1b]/95 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#d6b45d]/55 bg-[#2b2619] text-[#d6b45d]">
            <BookOpenIcon className="size-6" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="truncate text-[18px] font-black leading-tight tracking-normal text-white">
              {album.name}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-[13px] font-semibold text-white/72">
              <span>
                {album.ownedCount} de {album.total}
              </span>
              <span className="text-[#d6b45d]">{completion}%</span>
            </p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full border border-[#d6b45d]/65 bg-black/45">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#13c95f,#ffd65c)] shadow-[0_0_12px_rgba(19,201,95,0.38)] transition-[width]"
            style={{ width: `${completion}%` }}
          />
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="search-sections"
          className="pl-1 text-[13px] font-black leading-none tracking-normal text-white"
        >
          Buscar países
        </label>
        <div className="flex h-14 items-center gap-3 rounded-2xl border-2 border-[#d6b45d]/75 bg-[#171717]/95 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <SearchIcon className="size-5 shrink-0 text-[#d6b45d]" />
          <input
            id="search-sections"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar países..."
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-white/45"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {filteredSections.map((sec) => {
          const sectionSummary = snapshot.sections.find((x) => x.id === sec.id);
          const ownedCount = sectionSummary?.ownedCount ?? 0;
          const title = sec.title !== sec.id ? sec.title : "";
          const theme = getTheme(sec.id);
          const isExpanded = openSections.includes(sec.id);
          const isClosing = closingSections.includes(sec.id);
          const shouldRenderSlots = isExpanded || isClosing;

          return (
            <section
              key={sec.id}
              data-expanded={isExpanded ? "true" : "false"}
              style={sectionStyle(theme)}
              className="team-card relative overflow-hidden rounded-[1.15rem] border-2 px-2 shadow-[0_6px_16px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              {shouldRenderSlots && <TeamBackgroundForms />}
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggleSection(sec.id)}
                className="relative z-10 flex min-h-12 w-full items-center gap-2 px-1.5 py-2 text-left text-white outline-none focus-visible:ring-2 focus-visible:ring-white/35"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/45 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.28)]">
                    <SectionIcon section={sec} />
                  </span>
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="country-name-outline text-[15px] font-black leading-none tracking-normal text-white">
                      {sec.id}
                    </span>
                    {title && (
                      <span className="country-name-outline hidden truncate text-[11px] font-bold leading-none text-white/78 min-[380px]:inline">
                        {title}
                      </span>
                    )}
                  </span>
                </span>
                <Badge className="mr-1 h-7 rounded-full border border-white/30 bg-black/42 px-2.5 text-[12px] font-black text-white shadow-none">
                  {ownedCount}/{sec.total}
                </Badge>
                {isExpanded ? (
                  <ChevronUpIcon className="size-4 shrink-0 text-white" />
                ) : (
                  <ChevronDownIcon className="size-4 shrink-0 text-white" />
                )}
              </button>
              {shouldRenderSlots && (
                <div
                  className="country-stickers-panel relative z-10"
                  data-state={isExpanded ? "open" : "closing"}
                >
                  <div className="country-stickers-panel-inner pb-4 pt-1">
                    <div className="grid grid-cols-5 gap-2.5 px-1">
                    {sec.stickers.map((st) => {
                      const c = countByKey.get(st.key) ?? 0;
                      const owned = c >= 1;
                      const dup = c > 1;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => setOpenKey(st.key)}
                          aria-label={`${sec.id} ${st.displayNumber}`}
                          data-section={sec.id}
                          data-number={st.displayNumber}
                          style={slotStyle(theme, owned)}
                          className={cn(
                            "sticker-slot-lite relative flex aspect-[3/4] w-full overflow-hidden rounded-xl border-2 text-[12px] font-black leading-none tracking-normal shadow-[0_2px_6px_rgba(0,0,0,0.22)] active:scale-95",
                            !owned && "opacity-95",
                            owned && "shadow-[0_0_10px_rgba(255,255,255,0.14)]",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className="sticker-slot-label"
                          >
                            <span>{sec.id}</span>
                            <span>{st.displayNumber}</span>
                          </span>
                          {owned && (
                            <CheckIcon className="absolute right-1 top-1 z-20 size-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)]" />
                          )}
                          {dup && (
                            <Badge className="absolute bottom-1 right-1 z-20 h-5 rounded-full border border-white/20 bg-black/55 px-1.5 text-[10px] font-black text-white shadow-none">
                              x{c - 1}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {filteredSections.length === 0 && (
        <div className="rounded-2xl border border-[#d6b45d]/55 bg-[#171717]/90 px-4 py-6 text-center text-sm font-semibold text-white/70">
          Nenhum país encontrado.
        </div>
      )}

      <Sheet
        open={openKey !== null}
        onOpenChange={(o) => !o && setOpenKey(null)}
      >
        <SheetContent
          side="bottom"
          className="mx-auto w-[calc(100%-2rem)] max-w-[430px] rounded-t-[1.5rem] border-[#d6b45d]/55 bg-[#151515] pb-[calc(1rem+env(safe-area-inset-bottom))] text-white"
        >
          <SheetHeader className="p-4 pr-12">
            <SheetTitle className="flex items-center gap-2 text-lg font-black text-white">
              <ClipboardIcon className="size-5 text-[#d6b45d]" />
              {openSticker ? `${openSticker.sectionId}:${openSticker.displayNumber}` : ""}
            </SheetTitle>
          </SheetHeader>
          {openSticker && (
            <div className="flex flex-col gap-4 px-4">
              <p className="text-center text-sm font-semibold text-white/65">
                Quantidade no álbum:{" "}
                <span className="font-black tabular-nums text-[#35e66f]">
                  {openCount}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="rounded-2xl bg-[linear-gradient(180deg,#16d866,#0fb653)] text-base font-black text-white shadow-[0_8px_22px_rgba(16,190,88,0.24)] hover:bg-[#14c75d]"
                  onClick={() => void applyDelta(openSticker.key, 1)}
                >
                  Adicionar 1
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="rounded-2xl border-[#d6b45d]/75 bg-transparent text-base font-black text-[#d6b45d] hover:bg-[#d6b45d]/10 hover:text-[#f4d77c]"
                  disabled={openCount <= 0}
                  onClick={() => void applyDelta(openSticker.key, -1)}
                >
                  Remover 1
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
