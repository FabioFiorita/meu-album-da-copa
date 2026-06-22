import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  FlipHorizontalIcon,
  QrCodeIcon,
  Share2Icon,
} from "lucide-react";
import {
  lazy,
  memo,
  type MouseEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  CountStepper,
  EmptyState,
  SearchField,
  StickerSlot,
  TabHeaderCard,
} from "@/components/album";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAlbumSnapshot } from "@/hooks/useAlbumSnapshot";
import { useStickerActions } from "@/hooks/useStickerActions";
import type { AlbumSession } from "@/lib/albumSession";
import { copyText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";
import { buildTradeCompareUrl } from "@/lib/shareLinks";
import { normalizeAlbumCode } from "@convex/lib/access";
import {
  type AlbumSectionTemplate,
  WC_2026_TEMPLATE,
} from "@convex/lib/templates";
import {
  getTeamTheme,
  SectionIcon,
  sectionStyle,
  type TeamTheme,
} from "./teamVisuals";
import { TeamBackgroundForms } from "./TeamBackgroundForms";

const ShareQrPanel = lazy(() =>
  import("./ShareQrPanel").then((m) => ({ default: m.ShareQrPanel })),
);

function QrPanelFallback() {
  return (
    <div className="flex justify-center py-10">
      <Spinner className="size-6 text-[var(--app-gold)]" />
      <span className="sr-only">Carregando QR…</span>
    </div>
  );
}

type Props = { session: AlbumSession };

type DupRow = {
  key: string;
  sectionId: string;
  number: string;
  count: number;
};

const PANEL_ANIMATION_MS = 150;

function sortByNumber(a: DupRow, b: DupRow) {
  const an = Number(a.number);
  const bn = Number(b.number);
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
  return a.number.localeCompare(b.number);
}

function formatSectionLine(sectionId: string, rows: DupRow[]): string {
  const sorted = Array.from(rows).sort(sortByNumber);
  return `${sectionId}: ${sorted.map((r) => r.number).join(", ")}`;
}

type DuplicateCellProps = {
  stickerKey: string;
  sectionId: string;
  number: string;
  count: number;
  theme: TeamTheme;
  onDelta: (stickerKey: string, delta: number) => void;
};

/** A single repetida: the team-colored slot plus its −/+ count stepper. */
const DuplicateCell = memo(function DuplicateCell({
  stickerKey,
  sectionId,
  number,
  count,
  theme,
  onDelta,
}: DuplicateCellProps) {
  const handleDecrement = useCallback(
    () => onDelta(stickerKey, -1),
    [onDelta, stickerKey],
  );
  const handleIncrement = useCallback(
    () => onDelta(stickerKey, 1),
    [onDelta, stickerKey],
  );
  const extras = Math.max(0, count - 1);

  return (
    <div className="mx-auto flex w-full max-w-[8.5rem] flex-col gap-1.5">
      <StickerSlot
        sectionId={sectionId}
        number={number}
        theme={theme}
        owned={false}
        missing={false}
        duplicateCount={extras}
      />
      <CountStepper
        className="w-full justify-between"
        count={extras}
        min={0}
        onDecrement={handleDecrement}
        onIncrement={handleIncrement}
        decrementLabel={`Menos uma repetida de ${sectionId} ${number}`}
        incrementLabel={`Mais uma repetida de ${sectionId} ${number}`}
      />
    </div>
  );
});

type RepetidasSectionProps = {
  section: AlbumSectionTemplate;
  rows: DupRow[];
  isExpanded: boolean;
  isClosing: boolean;
  onToggle: (sectionId: string, isOpen: boolean) => void;
  onCopySection: (sectionId: string, rows: DupRow[]) => void;
  onDelta: (stickerKey: string, delta: number) => void;
};

/** Custom country accordion row: team-colored header + animated dup panel. */
const RepetidasSection = memo(function RepetidasSection({
  section,
  rows,
  isExpanded,
  isClosing,
  onToggle,
  onCopySection,
  onDelta,
}: RepetidasSectionProps) {
  const theme = getTeamTheme(section.id);
  const totalExtras = rows.reduce((sum, r) => sum + (r.count - 1), 0);
  const summary = rows.map((r) => r.number).join(", ");
  const title = section.title !== section.id ? section.title : "";
  const shouldRenderRows = isExpanded || isClosing;

  const handleToggle = useCallback(
    () => onToggle(section.id, isExpanded),
    [onToggle, section.id, isExpanded],
  );
  const handleCopy = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onCopySection(section.id, rows);
    },
    [onCopySection, section.id, rows],
  );

  return (
    <section
      data-expanded={isExpanded ? "true" : "false"}
      style={sectionStyle(theme)}
      className="team-card relative overflow-hidden rounded-[var(--app-radius-lg)] border-2 px-2 shadow-[var(--app-shadow-md)]"
    >
      {shouldRenderRows && <TeamBackgroundForms />}
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={handleToggle}
        className="relative z-10 flex min-h-12 w-full items-center gap-2 px-1.5 py-2 text-left text-[var(--team-ink)] outline-none focus-visible:ring-2 focus-visible:ring-white/35"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/45 bg-white shadow-[var(--app-shadow-sm)]">
            <SectionIcon section={section} />
          </span>
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="country-name-outline text-base font-black leading-none tracking-normal text-[var(--team-ink)]">
              {section.id}
            </span>
            {title && (
              <span className="country-name-outline hidden truncate text-xs font-bold leading-none text-[var(--team-ink)] min-[380px]:inline">
                {title}
              </span>
            )}
          </span>
        </span>
        <Badge className="mr-1 h-7 rounded-full border border-white/30 bg-[var(--app-scrim)] px-2.5 text-xs font-black text-white shadow-none">
          x{totalExtras}
        </Badge>
        {isExpanded ? (
          <ChevronUpIcon className="size-4 shrink-0 text-[var(--team-ink)]" />
        ) : (
          <ChevronDownIcon className="size-4 shrink-0 text-[var(--team-ink)]" />
        )}
      </button>

      {shouldRenderRows && (
        <div
          className="country-stickers-panel relative z-10"
          data-state={isExpanded ? "open" : "closing"}
        >
          <div className="country-stickers-panel-inner pb-4 pt-1">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <p className="country-name-outline min-w-0 truncate text-xs font-black leading-none text-[var(--team-ink)] tabular-nums">
                {summary}
              </p>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="repetidas-copy-button h-8 shrink-0 rounded-xl px-2 text-xs font-black text-white hover:bg-white/12 hover:text-white"
                onClick={handleCopy}
              >
                <CopyIcon className="size-3.5" />
                Copiar
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 px-1">
              {rows.map((r) => (
                <DuplicateCell
                  key={r.key}
                  stickerKey={r.key}
                  sectionId={r.sectionId}
                  number={r.number}
                  count={r.count}
                  theme={theme}
                  onDelta={onDelta}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

export function RepetidasTab({ session }: Props) {
  const { snapshot, isLoading } = useAlbumSnapshot();
  const actions = useStickerActions(session);
  const [q, setQ] = useState("");
  const [shareTradeQrOpen, setShareTradeQrOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [closingSections, setClosingSections] = useState<string[]>([]);
  const closeTimers = useRef<Record<string, number>>({});

  // Keep a stable `onDelta` for the memoized section list by reading the latest
  // (non-stable) optimistic action through a ref synced after each render.
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  });

  useEffect(() => {
    const timers = closeTimers.current;
    return () => {
      Object.values(timers).forEach(window.clearTimeout);
    };
  }, []);

  const dupRows: DupRow[] = useMemo(() => {
    if (!snapshot) return [];
    const rows: DupRow[] = [];
    for (const s of snapshot.stickers) {
      if (s.count < 2) continue;
      rows.push({
        key: s.key,
        sectionId: s.sectionId,
        number: s.number,
        count: s.count,
      });
    }
    return rows;
  }, [snapshot]);

  const dupBySection = useMemo(() => {
    const m = new Map<string, DupRow[]>();
    for (const r of dupRows) {
      const arr = m.get(r.sectionId) ?? [];
      arr.push(r);
      m.set(r.sectionId, arr);
    }
    for (const [, arr] of m) arr.sort(sortByNumber);
    return m;
  }, [dupRows]);

  const sections = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = WC_2026_TEMPLATE.sections.filter((s) => dupBySection.has(s.id));
    if (qq) {
      list = list.filter(
        (s) =>
          s.id.toLowerCase().includes(qq) ||
          s.title.toLowerCase().includes(qq),
      );
    }
    return list;
  }, [dupBySection, q]);

  const totalDupes = snapshot?.album.duplicateCount ?? 0;

  const onDelta = useCallback((key: string, delta: number) => {
    void (async () => {
      try {
        await actionsRef.current.applyDelta(key, delta);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    })();
  }, []);

  const onCopySection = useCallback((sectionId: string, rows: DupRow[]) => {
    if (rows.length === 0) return;
    void (async () => {
      try {
        await copyText(formatSectionLine(sectionId, rows));
        toast.success(`${sectionId} copiado.`);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    })();
  }, []);

  const onToggle = useCallback((sectionId: string, isOpen: boolean) => {
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
  }, []);

  async function copyAllAsText() {
    if (dupBySection.size === 0) return;
    const lines: string[] = [];
    for (const section of WC_2026_TEMPLATE.sections) {
      const rows = dupBySection.get(section.id);
      if (rows) lines.push(formatSectionLine(section.id, rows));
    }
    try {
      await copyText(lines.join("\n"));
      toast.success("Lista de repetidas copiada.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function sharePublic() {
    try {
      await copyText(normalizeAlbumCode(session.code));
      toast.success("Código público copiado.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="repetidas-tab mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-24 pt-4">
      <div className="flex flex-col gap-3">
        <TabHeaderCard
          icon={FlipHorizontalIcon}
          title="Repetidas"
          subtitle={`${totalDupes} figurinha${totalDupes === 1 ? "" : "s"} para troca`}
          action={
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                aria-label="Compartilhar repetidas"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-button-muted)] text-[var(--app-gold-accent)] outline-none transition-colors hover:bg-[var(--app-button-muted-hover)] hover:text-[var(--app-gold-strong)] focus-visible:ring-2 focus-visible:ring-[var(--app-border)]"
              >
                <Share2Icon />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)]"
              >
                <DropdownMenuItem onClick={() => void sharePublic()}>
                  Código público (comparação)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShareTradeQrOpen(true)}>
                  <QrCodeIcon />
                  QR para trocar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />

        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 w-full rounded-2xl border-[var(--app-border-strong)] bg-[var(--app-button-muted)] text-base font-black text-[var(--app-gold-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[var(--app-button-muted-hover)] hover:text-[var(--app-gold-strong)]"
          onClick={() => void copyAllAsText()}
          disabled={dupBySection.size === 0}
        >
          <CopyIcon />
          Copiar tudo
        </Button>
      </div>

      <Dialog open={shareTradeQrOpen} onOpenChange={setShareTradeQrOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto border-[var(--app-border)] bg-[var(--app-dialog-bg)] text-[var(--app-dialog-text)] ring-[var(--app-border)]">
          <DialogHeader>
            <DialogTitle>QR para trocar</DialogTitle>
            <DialogDescription className="text-[var(--app-muted-text)]">
              Mostre este QR para outra pessoa comparar as repetidas dela com o
              seu álbum.
            </DialogDescription>
          </DialogHeader>
          <Suspense fallback={<QrPanelFallback />}>
            <ShareQrPanel
              value={buildTradeCompareUrl(session.code)}
              title="Comparar comigo"
              description="Ao escanear, o app abre direto na aba Trocar com seu código público preenchido."
              copyLabel="Copiar link"
              rawLabel="Código público"
              rawValue={normalizeAlbumCode(session.code)}
            />
          </Suspense>
        </DialogContent>
      </Dialog>

      <SearchField
        id="search-dup"
        label="Buscar países"
        value={q}
        onChange={setQ}
        placeholder="Buscar países..."
      />

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 rounded-2xl bg-[var(--app-surface)]" />
          <Skeleton className="h-14 rounded-2xl bg-[var(--app-surface)]" />
          <Skeleton className="h-48 rounded-[var(--app-radius-lg)] bg-[var(--app-surface)]" />
        </div>
      ) : sections.length === 0 ? (
        <EmptyState
          icon={FlipHorizontalIcon}
          title="Nenhuma repetida"
          description="Quando tiver figurinhas sobrando, elas aparecem aqui."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {sections.map((sec) => (
            <RepetidasSection
              key={sec.id}
              section={sec}
              rows={dupBySection.get(sec.id) ?? []}
              isExpanded={openSections.includes(sec.id)}
              isClosing={closingSections.includes(sec.id)}
              onToggle={onToggle}
              onCopySection={onCopySection}
              onDelta={onDelta}
            />
          ))}
        </div>
      )}
    </div>
  );
}
