import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardIcon,
  SearchIcon,
} from "lucide-react";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlbumSession } from "@/lib/albumSession";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/lib/errors";
import { WC_2026_TEMPLATE } from "@convex/lib/templates";
import { TeamBackgroundForms } from "./TeamBackgroundForms";
import {
  getTeamTheme,
  SectionIcon,
  sectionStyle,
  slotStyle,
} from "./teamVisuals";

type Props = { session: AlbumSession };
type SectionTemplate = (typeof WC_2026_TEMPLATE.sections)[number];

export function AlbumTab({ session }: Props) {
  const snapshot = useQuery(api.albums.getPrivateSnapshot, {
    code: session.code,
    writeKey: session.writeKey,
  });
  const addCopies = useMutation(api.stickers.addCopies);
  const [q, setQ] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [openKey, setOpenKey] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ block: "start" });
    });
  }, [selectedSectionId]);

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
        s.id.toLowerCase().includes(qq) || s.title.toLowerCase().includes(qq),
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

  if (snapshot === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-4 pt-4">
        <Skeleton className="h-28 rounded-3xl bg-[#171717]" />
        <Skeleton className="h-14 rounded-2xl bg-[#171717]" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-24 rounded-2xl bg-[#171717]" />
          <Skeleton className="h-24 rounded-2xl bg-[#171717]" />
          <Skeleton className="h-24 rounded-2xl bg-[#171717]" />
          <Skeleton className="h-24 rounded-2xl bg-[#171717]" />
        </div>
      </div>
    );
  }

  const { album } = snapshot;
  const completion = Math.max(0, Math.min(100, album.completionPercentage));
  const selectedSection = selectedSectionId
    ? (WC_2026_TEMPLATE.sections.find((s) => s.id === selectedSectionId) ??
      null)
    : null;
  const openSticker =
    openKey == null
      ? null
      : (WC_2026_TEMPLATE.sections
          .flatMap((s) => s.stickers)
          .find((x) => x.key === openKey) ?? null);
  const openCount = openKey ? (countByKey.get(openKey) ?? 0) : 0;

  if (selectedSection) {
    return (
      <>
        <SectionDetail
          rootRef={topRef}
          section={selectedSection}
          countByKey={countByKey}
          onBack={() => setSelectedSectionId(null)}
          onOpenSticker={setOpenKey}
        />
        <StickerSheet
          openSticker={openSticker}
          openCount={openCount}
          setOpenKey={setOpenKey}
          applyDelta={applyDelta}
        />
      </>
    );
  }

  return (
    <div
      ref={topRef}
      className="mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-4 pt-4"
    >
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

      <div className="grid grid-cols-2 gap-2">
        {filteredSections.map((sec) => {
          const sectionSummary = snapshot.sections.find((x) => x.id === sec.id);
          const ownedCount =
            sectionSummary?.ownedCount ?? getOwnedCount(sec, countByKey);

          return (
            <SectionCard
              key={sec.id}
              section={sec}
              ownedCount={ownedCount}
              onClick={() => setSelectedSectionId(sec.id)}
            />
          );
        })}
      </div>

      {filteredSections.length === 0 && (
        <div className="rounded-2xl border border-[#d6b45d]/55 bg-[#171717]/90 px-4 py-6 text-center text-sm font-semibold text-white/70">
          Nenhum país encontrado.
        </div>
      )}
    </div>
  );
}

function SectionCard({
  section,
  ownedCount,
  onClick,
}: {
  section: SectionTemplate;
  ownedCount: number;
  onClick: () => void;
}) {
  const progress = percentage(ownedCount, section.total);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${section.id} ${section.title} ${ownedCount}/${section.total}`}
      className="min-h-[5.35rem] rounded-2xl border border-[#d6b45d]/45 bg-[#171717]/95 p-2 text-left shadow-[0_8px_22px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.08)] outline-none transition-colors hover:border-[#f4d77c]/70 hover:bg-[#1d1d1d] focus-visible:ring-2 focus-visible:ring-[#d6b45d]/35"
    >
      <div className="flex min-w-0 items-start gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/45 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.28)]">
          <SectionIcon section={section} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-black leading-tight tracking-normal text-white">
            {section.id}
          </span>
          <span className="mt-0.5 block truncate text-[9px] font-bold leading-tight text-white/66">
            {section.title}
          </span>
          <span className="mt-1 block text-[10px] font-black leading-none text-white tabular-nums">
            {ownedCount}/{section.total}
          </span>
        </span>
        <ChevronRightIcon className="mt-2 size-4 shrink-0 text-white/70" />
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full border border-[#d6b45d]/35 bg-black/48">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#13c95f,#ffd65c)] transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </button>
  );
}

function SectionDetail({
  rootRef,
  section,
  countByKey,
  onBack,
  onOpenSticker,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  section: SectionTemplate;
  countByKey: Map<string, number>;
  onBack: () => void;
  onOpenSticker: (key: string) => void;
}) {
  const theme = getTeamTheme(section.id);
  const ownedCount = getOwnedCount(section, countByKey);
  const duplicateCount = getDuplicateCount(section, countByKey);
  const missingCount = Math.max(0, section.total - ownedCount);
  const progress = percentage(ownedCount, section.total);

  return (
    <div
      ref={rootRef}
      className="album-detail mx-auto flex w-full max-w-[430px] flex-col gap-3 pb-4 pt-3"
    >
      <section
        style={sectionStyle(theme)}
        className="team-card relative overflow-hidden rounded-[1.35rem] border-2 p-3 shadow-[0_14px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]"
      >
        <TeamBackgroundForms />
        <div className="absolute inset-0 z-[1] bg-black/14" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-black/32 text-white outline-none hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-white/35"
            >
              <ArrowLeftIcon className="size-5" />
            </button>
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/55 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.32)]">
              <SectionIcon section={section} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="country-name-outline truncate text-[22px] font-black leading-none tracking-normal text-white">
                {section.id}
              </h1>
              <p className="country-name-outline mt-1 truncate text-[12px] font-bold leading-none text-white/82">
                {section.title}
              </p>
            </div>
            <Badge className="h-7 shrink-0 rounded-full border border-[#35e66f]/55 bg-black/45 px-2.5 text-[11px] font-black text-[#35e66f] shadow-none tabular-nums">
              {ownedCount}/{section.total}
            </Badge>
          </div>

          <div className="album-detail-stats rounded-[1.15rem] border border-white/16 bg-[#171717]/90 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
            <div className="grid grid-cols-[1.15fr_0.75fr_0.75fr_0.75fr] items-stretch gap-3">
              <div className="border-r border-white/14 pr-3">
                <p className="album-detail-stat-label text-[10px] font-black leading-none text-white/60">
                  Progresso
                </p>
                <p className="album-detail-stat-value mt-2 text-[12px] font-black leading-none text-white tabular-nums">
                  {progress}%
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full border border-[#d6b45d]/35 bg-black/48">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#13c95f,#ffd65c)] transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <Stat label="Coladas" value={ownedCount} />
              <Stat label="Faltam" value={missingCount} />
              <Stat label="Repetidas" value={duplicateCount} />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2.5 pb-1">
            {section.stickers.map((st) => {
              const c = countByKey.get(st.key) ?? 0;
              const owned = c >= 1;
              const dup = c > 1;

              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => onOpenSticker(st.key)}
                  aria-label={`${section.id} ${st.displayNumber}`}
                  data-section={section.id}
                  data-number={st.displayNumber}
                  style={slotStyle(theme, owned)}
                  className={cn(
                    "sticker-slot-lite relative flex aspect-[3/4] w-full overflow-hidden rounded-xl border-2 text-[12px] font-black leading-none tracking-normal shadow-[0_2px_6px_rgba(0,0,0,0.22)] active:scale-95",
                    !owned && "opacity-95",
                    owned && "shadow-[0_0_10px_rgba(255,255,255,0.14)]",
                  )}
                >
                  <span aria-hidden="true" className="sticker-slot-label">
                    <span>{section.id}</span>
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
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 text-center">
      <p className="album-detail-stat-label truncate text-[10px] font-black leading-none text-white/58">
        {label}
      </p>
      <p className="album-detail-stat-value mt-3 text-[17px] font-black leading-none text-[#f4d77c] tabular-nums">
        {value}
      </p>
    </div>
  );
}

function StickerSheet({
  openSticker,
  openCount,
  setOpenKey,
  applyDelta,
}: {
  openSticker:
    | null
    | (typeof WC_2026_TEMPLATE.sections)[number]["stickers"][number];
  openCount: number;
  setOpenKey: (key: string | null) => void;
  applyDelta: (key: string, delta: number) => Promise<void>;
}) {
  return (
    <Sheet
      open={openSticker !== null}
      onOpenChange={(o) => !o && setOpenKey(null)}
    >
      <SheetContent
        side="bottom"
        className="mx-auto w-[calc(100%-2rem)] max-w-[430px] rounded-t-[1.5rem] border-[#d6b45d]/55 bg-[#151515] pb-[calc(1rem+env(safe-area-inset-bottom))] text-white"
      >
        <SheetHeader className="p-4 pr-12">
          <SheetTitle className="flex items-center gap-2 text-lg font-black text-white">
            <ClipboardIcon className="size-5 text-[#d6b45d]" />
            {openSticker
              ? `${openSticker.sectionId}:${openSticker.displayNumber}`
              : ""}
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
  );
}

function getOwnedCount(
  section: SectionTemplate,
  countByKey: Map<string, number>,
) {
  return section.stickers.reduce(
    (sum, st) => sum + ((countByKey.get(st.key) ?? 0) >= 1 ? 1 : 0),
    0,
  );
}

function getDuplicateCount(
  section: SectionTemplate,
  countByKey: Map<string, number>,
) {
  return section.stickers.reduce(
    (sum, st) => sum + Math.max(0, (countByKey.get(st.key) ?? 0) - 1),
    0,
  );
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}
