import {
  BookOpenIcon,
  ChevronRightIcon,
  ClipboardIcon,
  CopyIcon,
  SearchIcon,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CountStepper,
  EmptyState,
  ProgressBar,
  SearchField,
  StatTile,
  StickerSlot,
  TabHeaderCard,
} from "@/components/album";
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
import { useAlbumSnapshot, type AlbumSnapshot } from "@/hooks/useAlbumSnapshot";
import { useStickerActions } from "@/hooks/useStickerActions";
import { percentage } from "@/lib/albumMath";
import type { AlbumSession } from "@/lib/albumSession";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/lib/errors";
import { WC_2026_TEMPLATE } from "@convex/lib/templates";
import { TeamBackgroundForms } from "./TeamBackgroundForms";
import {
  getTeamTheme,
  SectionIcon,
  sectionStyle,
  type TeamTheme,
} from "./teamVisuals";

type Props = { session: AlbumSession };
type SectionTemplate = (typeof WC_2026_TEMPLATE.sections)[number];
type StickerTemplate = SectionTemplate["stickers"][number];
type SectionSummary = AlbumSnapshot["sections"][number];

export function AlbumTab({ session }: Props) {
  const { snapshot } = useAlbumSnapshot();
  const { applyDelta: applyStickerDelta } = useStickerActions(session);
  const [q, setQ] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [openKey, setOpenKey] = useState<string | null>(null);

  // `applyStickerDelta` is stable across renders (memoized in useStickerActions),
  // so the memoized list rows below don't re-render on every snapshot tick.
  const applyDelta = useCallback(
    async (key: string, delta: number) => {
      try {
        await applyStickerDelta(key, delta);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    },
    [applyStickerDelta],
  );

  const countByKey = useMemo(() => {
    const m = new Map<string, number>();
    if (!snapshot) return m;
    for (const s of snapshot.stickers) {
      m.set(s.key, s.count);
    }
    return m;
  }, [snapshot]);

  const missingBySection = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const sec of WC_2026_TEMPLATE.sections) {
      const nums: string[] = [];
      for (const st of sec.stickers) {
        if ((countByKey.get(st.key) ?? 0) < 1) nums.push(st.number);
      }
      if (nums.length) m.set(sec.id, nums);
    }
    return m;
  }, [countByKey]);

  // Server-computed per-section owned/duplicate totals, keyed by section id, so
  // the grid never has to re-scan every sticker (O(n^2)).
  const sectionSummaryById = useMemo(() => {
    const m = new Map<string, SectionSummary>();
    if (!snapshot) return m;
    for (const s of snapshot.sections) {
      m.set(s.id, s);
    }
    return m;
  }, [snapshot]);

  // Template lookups (stable for the lifetime of the tab).
  const sectionTemplateById = useMemo(() => {
    const m = new Map<string, SectionTemplate>();
    for (const sec of WC_2026_TEMPLATE.sections) {
      m.set(sec.id, sec);
    }
    return m;
  }, []);

  const stickerByKey = useMemo(() => {
    const m = new Map<string, StickerTemplate>();
    for (const sec of WC_2026_TEMPLATE.sections) {
      for (const st of sec.stickers) {
        m.set(st.key, st);
      }
    }
    return m;
  }, []);

  const filteredSections = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return WC_2026_TEMPLATE.sections;
    return WC_2026_TEMPLATE.sections.filter(
      (s) =>
        s.id.toLowerCase().includes(qq) || s.title.toLowerCase().includes(qq),
    );
  }, [q]);

  if (snapshot === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-4 pt-4">
        <Skeleton className="h-28 rounded-[var(--app-radius-2xl)] bg-[var(--app-surface)]" />
        <Skeleton className="h-14 rounded-[var(--app-radius-lg)] bg-[var(--app-surface)]" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-24 rounded-[var(--app-radius-lg)] bg-[var(--app-surface)]" />
          <Skeleton className="h-24 rounded-[var(--app-radius-lg)] bg-[var(--app-surface)]" />
          <Skeleton className="h-24 rounded-[var(--app-radius-lg)] bg-[var(--app-surface)]" />
          <Skeleton className="h-24 rounded-[var(--app-radius-lg)] bg-[var(--app-surface)]" />
        </div>
      </div>
    );
  }

  const { album } = snapshot;
  const completion = Math.max(0, Math.min(100, album.completionPercentage));
  const selectedSection = selectedSectionId
    ? (sectionTemplateById.get(selectedSectionId) ?? null)
    : null;
  const selectedSummary = selectedSectionId
    ? (sectionSummaryById.get(selectedSectionId) ?? null)
    : null;
  const openSticker = openKey == null ? null : (stickerByKey.get(openKey) ?? null);
  const openCount = openKey ? (countByKey.get(openKey) ?? 0) : 0;

  async function copyMissingAsText() {
    if (missingBySection.size === 0) return;
    const lines: string[] = [];
    for (const section of WC_2026_TEMPLATE.sections) {
      const nums = missingBySection.get(section.id);
      if (nums) lines.push(`${section.id}: ${nums.join(", ")}`);
    }
    try {
      await copyText(lines.join("\n"));
      toast.success("Lista de faltantes copiada.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-4 pt-4">
        <TabHeaderCard
          icon={BookOpenIcon}
          title={album.name}
          subtitle={
            <>
              <span className="flex items-center gap-2">
                <span>
                  {album.ownedCount} de {album.total}
                </span>
                <span className="text-[var(--app-gold-accent)]">
                  {completion}%
                </span>
              </span>
              <ProgressBar value={completion} className="mt-3" />
            </>
          }
        />

        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 w-full rounded-2xl border-[var(--app-border-strong)] bg-[var(--app-button-muted)] text-base font-black text-[var(--app-gold-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[var(--app-button-muted-hover)] hover:text-[var(--app-gold-strong)]"
          onClick={() => void copyMissingAsText()}
          disabled={missingBySection.size === 0}
        >
          <CopyIcon />
          Copiar faltantes
        </Button>

        <SearchField
          id="search-sections"
          label="Buscar países"
          value={q}
          onChange={setQ}
          placeholder="Buscar países..."
        />

        {filteredSections.length === 0 ? (
          <EmptyState icon={SearchIcon} description="Nenhum país encontrado." />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredSections.map((sec) => (
              <SectionCard
                key={sec.id}
                section={sec}
                ownedCount={sectionSummaryById.get(sec.id)?.ownedCount ?? 0}
                onSelect={setSelectedSectionId}
              />
            ))}
          </div>
        )}
      </div>

      <SectionSheet
        section={selectedSection}
        summary={selectedSummary}
        countByKey={countByKey}
        onClose={() => setSelectedSectionId(null)}
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

const SectionCard = memo(function SectionCard({
  section,
  ownedCount,
  onSelect,
}: {
  section: SectionTemplate;
  ownedCount: number;
  onSelect: (sectionId: string) => void;
}) {
  const progress = percentage(ownedCount, section.total);
  const handleClick = useCallback(
    () => onSelect(section.id),
    [onSelect, section.id],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${section.id} ${section.title} ${ownedCount}/${section.total}`}
      className="min-h-[5.35rem] touch-manipulation rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface)] p-2 text-left shadow-[var(--app-shadow-md)] outline-none transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-elevated)] focus-visible:ring-2 focus-visible:ring-[var(--app-border-soft)]"
    >
      <div className="flex min-w-0 items-start gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/45 bg-white shadow-[var(--app-shadow-sm)]">
          <SectionIcon section={section} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black leading-tight tracking-normal text-[var(--app-text)]">
            {section.id}
          </span>
          <span className="mt-0.5 block truncate text-2xs font-bold leading-tight text-[var(--app-muted-text)]">
            {section.title}
          </span>
          <span className="mt-1 block text-2xs font-black leading-none text-[var(--app-text)] tabular-nums">
            {ownedCount}/{section.total}
          </span>
        </span>
        <ChevronRightIcon className="mt-2 size-4 shrink-0 text-[var(--app-muted-text)]" />
      </div>
      <ProgressBar
        value={progress}
        trackClassName="mt-2 h-1.5 border-[var(--app-border-soft)]"
      />
    </button>
  );
});

function SectionSheet({
  section,
  summary,
  countByKey,
  onClose,
  onOpenSticker,
  applyDelta,
}: {
  section: SectionTemplate | null;
  summary: SectionSummary | null;
  countByKey: Map<string, number>;
  onClose: () => void;
  onOpenSticker: (key: string) => void;
  applyDelta: (key: string, delta: number) => Promise<void>;
}) {
  if (!section) {
    return null;
  }

  const theme = getTeamTheme(section.id);
  const ownedCount = summary?.ownedCount ?? 0;
  const duplicateCount = summary?.duplicateCount ?? 0;
  const missingCount = Math.max(0, section.total - ownedCount);
  const progress = percentage(ownedCount, section.total);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        overlayPointerEvents="none"
        style={sectionStyle(theme)}
        className="team-card album-detail mx-auto flex !h-[78svh] max-h-[48rem] w-[calc(100%-1.25rem)] max-w-[430px] gap-0 overflow-hidden rounded-t-[var(--app-radius-xl)] border-2 p-0 text-white shadow-[0_-18px_42px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.12)]"
      >
        <TeamBackgroundForms />
        <div className="absolute inset-0 z-[1] bg-black/14" />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <SheetHeader className="shrink-0 border-b border-white/14 bg-black/18 p-3 pr-12 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/55 bg-white shadow-[var(--app-shadow-sm)]">
                <SectionIcon section={section} />
              </span>
              <div className="min-w-0 flex-1">
                <SheetTitle className="country-name-outline truncate text-xl font-semibold leading-none tracking-normal text-[var(--team-ink)]">
                  {section.id}
                </SheetTitle>
                <p className="country-name-outline mt-1 truncate text-xs font-bold leading-none text-[var(--team-ink)]">
                  {section.title}
                </p>
              </div>
              <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-[var(--app-success)] px-2.5 text-xs font-black text-[var(--app-on-accent)] tabular-nums">
                {ownedCount}/{section.total}
              </span>
            </div>
            <SheetDescription className="sr-only">
              Figurinhas de {section.title}: {ownedCount} possuídas,{" "}
              {missingCount} faltantes e {duplicateCount} repetidas.
            </SheetDescription>
          </SheetHeader>

          <div className="album-detail-stats mx-3 mt-2 shrink-0 rounded-[var(--app-radius-md)] border border-white/16 bg-[var(--app-card)] p-2.5 shadow-[var(--app-shadow-md)] backdrop-blur">
            <div className="grid grid-cols-[1.05fr_0.75fr_0.75fr_0.75fr] items-stretch gap-2.5">
              <div className="border-r border-white/14 pr-2.5">
                <p className="album-detail-stat-label text-2xs font-black leading-none text-[var(--app-muted-text)]">
                  Progresso
                </p>
                <p className="album-detail-stat-value mt-2 text-xs font-black leading-none text-[var(--app-text)] tabular-nums">
                  {progress}%
                </p>
                <ProgressBar
                  value={progress}
                  trackClassName="mt-2 h-1.5 border-[var(--app-border-soft)]"
                />
              </div>
              <StatTile label="Coladas" value={ownedCount} />
              <StatTile label="Faltam" value={missingCount} />
              <StatTile label="Repetidas" value={duplicateCount} />
            </div>
          </div>

          <ScrollArea
            key={section.id}
            className="album-sticker-scroll-area mt-2 min-h-0 flex-1 px-3 pb-3"
          >
            <div className="flex flex-col gap-2 pr-2 pb-3">
              {section.stickers.map((st) => (
                <StickerStatusCard
                  key={st.key}
                  sectionId={section.id}
                  theme={theme}
                  stickerKey={st.key}
                  displayNumber={st.displayNumber}
                  count={countByKey.get(st.key) ?? 0}
                  onOpenSticker={onOpenSticker}
                  applyDelta={applyDelta}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const StickerStatusCard = memo(function StickerStatusCard({
  sectionId,
  count,
  theme,
  stickerKey,
  displayNumber,
  onOpenSticker,
  applyDelta,
}: {
  sectionId: string;
  count: number;
  theme: TeamTheme;
  stickerKey: string;
  displayNumber: string;
  onOpenSticker: (key: string) => void;
  applyDelta: (key: string, delta: number) => Promise<void>;
}) {
  const owned = count >= 1;
  const duplicateCount = Math.max(0, count - 1);

  const handleOpen = useCallback(
    () => onOpenSticker(stickerKey),
    [onOpenSticker, stickerKey],
  );
  const handleDecrement = useCallback(
    () => void applyDelta(stickerKey, -1),
    [applyDelta, stickerKey],
  );
  const handleIncrement = useCallback(
    () => void applyDelta(stickerKey, 1),
    [applyDelta, stickerKey],
  );

  return (
    <article
      data-owned={owned ? "true" : "false"}
      className={cn(
        "grid grid-cols-[3.6rem_minmax(0,1fr)_auto] items-center gap-2 rounded-[var(--app-radius-md)] border p-2 shadow-[var(--app-shadow-md)] backdrop-blur",
        owned
          ? "border-[var(--app-success-bright)]/45 bg-black/38"
          : "border-white/28 bg-black/54",
      )}
    >
      <StickerSlot
        sectionId={sectionId}
        number={displayNumber}
        theme={theme}
        owned={owned}
        missing={!owned}
        duplicateCount={duplicateCount}
        onClick={handleOpen}
        ariaLabel={`${sectionId} ${displayNumber}, ${
          owned ? "possuída" : "faltante"
        }${
          duplicateCount
            ? `, ${duplicateCount} repetida${duplicateCount === 1 ? "" : "s"}`
            : ""
        }`}
      />

      <div className="min-w-0">
        <p className="country-name-outline text-xs font-black leading-none text-white">
          {sectionId} {displayNumber}
        </p>
        <p
          className={cn(
            "mt-1 text-xs font-black uppercase leading-none",
            owned ? "text-[var(--app-success-bright)]" : "text-white/76",
          )}
        >
          {owned ? "Tenho" : "Falta"}
        </p>
        {duplicateCount > 0 && (
          <p className="mt-1 text-2xs font-bold leading-none text-white/72">
            {duplicateCount} repetida{duplicateCount === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <CountStepper
        count={count}
        onDecrement={handleDecrement}
        onIncrement={handleIncrement}
        decrementLabel={`Remover uma ${sectionId} ${displayNumber}`}
        incrementLabel={`Adicionar uma ${sectionId} ${displayNumber}`}
      />
    </article>
  );
});

function StickerSheet({
  openSticker,
  openCount,
  setOpenKey,
  applyDelta,
}: {
  openSticker: StickerTemplate | null;
  openCount: number;
  setOpenKey: (key: string | null) => void;
  applyDelta: (key: string, delta: number) => Promise<void>;
}) {
  return (
    <Sheet open={openSticker !== null} onOpenChange={(o) => !o && setOpenKey(null)}>
      <SheetContent
        side="bottom"
        className="mx-auto w-[calc(100%-2rem)] max-w-[430px] rounded-t-[var(--app-radius-2xl)] border-[var(--app-border-strong)] bg-[var(--app-surface-strong)] pb-[calc(1rem+env(safe-area-inset-bottom))] text-[var(--app-text)]"
      >
        <SheetHeader className="p-4 pr-12">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold text-[var(--app-text)]">
            <ClipboardIcon className="size-5 text-[var(--app-gold-accent)]" />
            {openSticker
              ? `${openSticker.sectionId}:${openSticker.displayNumber}`
              : ""}
          </SheetTitle>
        </SheetHeader>
        {openSticker && (
          <div className="flex flex-col items-center gap-4 px-4">
            <p className="text-center text-sm font-semibold text-[var(--app-muted-text)]">
              Quantidade no álbum
            </p>
            <CountStepper
              className="gap-2"
              count={openCount}
              onDecrement={() => void applyDelta(openSticker.key, -1)}
              onIncrement={() => void applyDelta(openSticker.key, 1)}
              decrementLabel={`Remover uma ${openSticker.sectionId} ${openSticker.displayNumber}`}
              incrementLabel={`Adicionar uma ${openSticker.sectionId} ${openSticker.displayNumber}`}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
