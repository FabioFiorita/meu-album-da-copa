import { useMutation, useQuery } from "convex/react";
import {
  BookOpenIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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

  return (
    <>
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-4 pt-4">
        <section className="rounded-[1.35rem] border-2 border-[#d6b45d] bg-[#1b1b1b]/95 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#d6b45d]/55 bg-[#2b2619] text-[#d6b45d]">
              <BookOpenIcon className="size-6" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="truncate text-[18px] font-semibold leading-tight tracking-normal text-white">
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
              className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/45"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {filteredSections.map((sec) => {
            const sectionSummary = snapshot.sections.find(
              (x) => x.id === sec.id,
            );
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

      <SectionSheet
        section={selectedSection}
        countByKey={countByKey}
        setSelectedSectionId={setSelectedSectionId}
        onOpenSticker={setOpenKey}
        applyDelta={applyDelta}
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

function SectionSheet({
  section,
  countByKey,
  setSelectedSectionId,
  onOpenSticker,
  applyDelta,
}: {
  section: SectionTemplate | null;
  countByKey: Map<string, number>;
  setSelectedSectionId: (sectionId: string | null) => void;
  onOpenSticker: (key: string) => void;
  applyDelta: (key: string, delta: number) => Promise<void>;
}) {
  if (!section) {
    return null;
  }

  const theme = getTeamTheme(section.id);
  const ownedCount = getOwnedCount(section, countByKey);
  const duplicateCount = getDuplicateCount(section, countByKey);
  const missingCount = Math.max(0, section.total - ownedCount);
  const progress = percentage(ownedCount, section.total);

  return (
    <Sheet
      open={section !== null}
      onOpenChange={(open) => !open && setSelectedSectionId(null)}
    >
      <SheetContent
        side="bottom"
        style={sectionStyle(theme)}
        className="team-card album-detail mx-auto flex !h-[78svh] max-h-[48rem] w-[calc(100%-1.25rem)] max-w-[430px] gap-0 overflow-hidden rounded-t-[1.35rem] border-2 p-0 text-white shadow-[0_-18px_42px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.12)]"
      >
        <TeamBackgroundForms />
        <div className="absolute inset-0 z-[1] bg-black/14" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <SheetHeader className="shrink-0 border-b border-white/14 bg-black/18 p-3 pr-12 backdrop-blur">
            <div className="flex items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/55 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.32)]">
              <SectionIcon section={section} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="country-name-outline truncate text-[20px] font-semibold leading-none tracking-normal text-white">
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
            <SheetDescription className="sr-only">
              Figurinhas de {section.title}: {ownedCount} possuídas,{" "}
              {missingCount} faltantes e {duplicateCount} repetidas.
            </SheetDescription>
          </SheetHeader>

          <div className="mx-3 mt-2 shrink-0 rounded-[1rem] border border-white/16 bg-[#171717]/90 p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
            <div className="grid grid-cols-[1.05fr_0.75fr_0.75fr_0.75fr] items-stretch gap-2.5">
              <div className="border-r border-white/14 pr-2.5">
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

          <ScrollArea className="album-sticker-scroll-area mt-2 min-h-0 flex-1 px-3 pb-3">
            <div className="flex flex-col gap-2 pr-2 pb-3">
            {section.stickers.map((st) => {
              const c = countByKey.get(st.key) ?? 0;

              return (
                <StickerStatusCard
                  key={st.key}
                  section={section}
                  count={c}
                  theme={theme}
                  stickerKey={st.key}
                  displayNumber={st.displayNumber}
                  onOpenSticker={onOpenSticker}
                  applyDelta={applyDelta}
                />
              );
            })}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StickerStatusCard({
  section,
  count,
  theme,
  stickerKey,
  displayNumber,
  onOpenSticker,
  applyDelta,
}: {
  section: SectionTemplate;
  count: number;
  theme: ReturnType<typeof getTeamTheme>;
  stickerKey: string;
  displayNumber: string;
  onOpenSticker: (key: string) => void;
  applyDelta: (key: string, delta: number) => Promise<void>;
}) {
  const owned = count >= 1;
  const duplicateCount = Math.max(0, count - 1);

  return (
    <article
      data-owned={owned ? "true" : "false"}
      className={cn(
        "grid grid-cols-[3.6rem_minmax(0,1fr)_auto] items-center gap-2 rounded-[1rem] border p-2 shadow-[0_8px_20px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur",
        owned
          ? "border-[#35e66f]/45 bg-black/38"
          : "border-white/28 bg-black/54",
      )}
    >
      <button
        type="button"
        onClick={() => onOpenSticker(stickerKey)}
        aria-label={`${section.id} ${displayNumber}, ${
          owned ? "possuída" : "faltante"
        }${duplicateCount ? `, ${duplicateCount} repetida${duplicateCount === 1 ? "" : "s"}` : ""}`}
        data-section={section.id}
        data-number={displayNumber}
        data-owned={owned ? "true" : "false"}
        style={slotStyle(theme, owned)}
        className={cn(
          "sticker-slot-lite relative flex aspect-[3/4] w-full overflow-hidden rounded-xl border-2 text-[11px] font-black leading-none tracking-normal shadow-[0_2px_6px_rgba(0,0,0,0.22)] outline-none active:scale-95 focus-visible:ring-2 focus-visible:ring-white/45",
          owned
            ? "shadow-[0_0_12px_rgba(53,230,111,0.18)]"
            : "border-dashed opacity-100 brightness-[0.72] grayscale-[0.28]",
        )}
      >
        <span aria-hidden="true" className="sticker-slot-label">
          <span>{section.id}</span>
          <span>{displayNumber}</span>
        </span>
        {owned ? (
          <span className="absolute right-1 top-1 z-20 flex size-4 items-center justify-center rounded-full bg-[#0a7a32] text-white shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            <CheckIcon className="size-3" />
          </span>
        ) : (
          <span className="absolute inset-x-1 bottom-1 z-20 rounded-full border border-white/22 bg-black/64 py-0.5 text-center text-[7px] font-black uppercase leading-none text-white">
            Falta
          </span>
        )}
        {duplicateCount > 0 && (
          <Badge className="absolute bottom-1 right-1 z-20 h-5 rounded-full border border-white/20 bg-black/55 px-1.5 text-[10px] font-black text-white shadow-none">
            x{duplicateCount}
          </Badge>
        )}
      </button>

      <div className="min-w-0">
          <p className="country-name-outline text-[12px] font-black leading-none text-white">
            {section.id} {displayNumber}
          </p>
          <p
            className={cn(
              "mt-1 text-[11px] font-black uppercase leading-none",
              owned ? "text-[#35e66f]" : "text-white/76",
            )}
          >
            {owned ? "Tenho" : "Falta"}
          </p>
          {duplicateCount > 0 && (
            <p className="mt-1 text-[10px] font-bold leading-none text-white/72">
              {duplicateCount} repetida{duplicateCount === 1 ? "" : "s"}
            </p>
          )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            className="size-8 rounded-xl border-white/35 bg-black/24 text-white hover:bg-white/12 hover:text-white"
            aria-label={`Remover uma ${section.id} ${displayNumber}`}
            disabled={count <= 0}
            onClick={() => void applyDelta(stickerKey, -1)}
          >
            <MinusIcon className="size-4" />
          </Button>
          <span className="flex h-8 min-w-8 items-center justify-center rounded-xl border border-white/18 bg-black/38 px-2 text-[12px] font-black text-white tabular-nums">
            {count}
          </span>
          <Button
            type="button"
            size="icon-sm"
            className="size-8 rounded-xl bg-[#13c95f] text-white shadow-none hover:bg-[#14b957]"
            aria-label={`Adicionar uma ${section.id} ${displayNumber}`}
            onClick={() => void applyDelta(stickerKey, 1)}
          >
            <PlusIcon className="size-4" />
          </Button>
      </div>
    </article>
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
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-white">
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
