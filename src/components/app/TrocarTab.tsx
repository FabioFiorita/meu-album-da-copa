import { useQuery } from "convex/react";
import {
  ArrowLeftRightIcon,
  ClipboardPasteIcon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
  QrCodeIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { lazy, memo, Suspense, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { EmptyState, StickerSlot, TabHeaderCard } from "@/components/album";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { useStickerActions } from "@/hooks/useStickerActions";
import type { AlbumSession } from "@/lib/albumSession";
import { pasteFromClipboard } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";
import { buildTradeCompareUrl } from "@/lib/shareLinks";
import { normalizeAlbumCode, parseFullAccessCode } from "@convex/lib/access";
import { WC_2026_TEMPLATE } from "@convex/lib/templates";
import { TeamBackgroundForms } from "./TeamBackgroundForms";
import { getTeamTheme, SectionIcon, sectionStyle } from "./teamVisuals";

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

type Props = { session: AlbumSession; initialOtherCode?: string };

type Row = {
  key: string;
  sectionId: string;
  number: string;
  myDuplicateQuantity: number;
  theirDuplicateQuantity: number;
};

type TradeKind = "iGive" | "iReceive";

const CONTAINER_CLASS =
  "trocar-tab mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-24 pt-4";

const GOLD_OUTLINE_BUTTON_CLASS =
  "h-12 rounded-[var(--app-radius-md)] border-[var(--app-border-strong)] bg-[var(--app-button-muted)] text-base font-black text-[var(--app-gold-accent)] shadow-[var(--app-shadow-sm)] hover:bg-[var(--app-button-muted-hover)] hover:text-[var(--app-gold-strong)]";

function sortRows(a: Row, b: Row) {
  if (a.sectionId !== b.sectionId) {
    return a.sectionId.localeCompare(b.sectionId);
  }
  const an = Number(a.number);
  const bn = Number(b.number);
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
  return a.number.localeCompare(b.number);
}

function groupBySection(rows: Row[]): Map<string, Row[]> {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const arr = m.get(r.sectionId) ?? [];
    arr.push(r);
    m.set(r.sectionId, arr);
  }
  return m;
}

function sectionTemplate(sectionId: string) {
  return WC_2026_TEMPLATE.sections.find((s) => s.id === sectionId);
}

function sectionTitle(sectionId: string): string {
  return sectionTemplate(sectionId)?.title ?? sectionId;
}

function normalizeInitialOtherCode(
  initialOtherCode: string | undefined,
  myCode: string,
): string | null {
  if (!initialOtherCode) return null;
  const code = normalizeAlbumCode(initialOtherCode);
  if (code.length < 8 || code === normalizeAlbumCode(myCode)) return null;
  return code;
}

export function TrocarTab({ session, initialOtherCode }: Props) {
  const normalizedInitialOtherCode = normalizeInitialOtherCode(
    initialOtherCode,
    session.code,
  );
  const [draft, setDraft] = useState(normalizedInitialOtherCode ?? "");
  const [otherCode, setOtherCode] = useState<string | null>(
    normalizedInitialOtherCode,
  );
  const [shareTradeQrOpen, setShareTradeQrOpen] = useState(false);

  function submitCode() {
    const t = draft.trim();
    if (!t) {
      toast.error("Cole o código público do outro álbum.");
      return;
    }
    const full = parseFullAccessCode(t);
    const code = full ? full.code : normalizeAlbumCode(t);
    if (code.length < 8) {
      toast.error("Código inválido.");
      return;
    }
    if (code === normalizeAlbumCode(session.code)) {
      toast.error("Esse é o seu próprio código.");
      return;
    }
    setOtherCode(code);
  }

  const clear = useCallback(() => {
    setOtherCode(null);
    setDraft("");
  }, []);

  async function paste() {
    try {
      const v = await pasteFromClipboard();
      setDraft(v);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const renderCompareError = useCallback(
    (reset: () => void) => (
      <div className={CONTAINER_CLASS}>
        <EmptyState
          icon={TriangleAlertIcon}
          title="Não foi possível comparar"
          description="Não foi possível comparar com esse álbum. Verifique o código ou se a comparação pública está ativada."
          action={
            <Button
              type="button"
              size="lg"
              variant="outline"
              className={GOLD_OUTLINE_BUTTON_CLASS}
              onClick={() => {
                reset();
                clear();
              }}
            >
              <ArrowLeftRightIcon className="size-5" />
              Tentar outro código
            </Button>
          }
        />
      </div>
    ),
    [clear],
  );

  if (otherCode) {
    return (
      <ErrorBoundary fallback={renderCompareError}>
        <CompareView session={session} otherCode={otherCode} onClear={clear} />
      </ErrorBoundary>
    );
  }

  return (
    <div className={CONTAINER_CLASS}>
      <TabHeaderCard
        icon={ArrowLeftRightIcon}
        title="Trocar"
        subtitle="Cole o código público de outro álbum para comparar as repetidas."
      />

      <div className="flex flex-col gap-2">
        <label
          htmlFor="other-code"
          className="pl-1 text-sm font-black leading-none tracking-normal text-[var(--app-text)]"
        >
          Código público
        </label>
        <div className="flex h-14 items-center gap-3 rounded-[var(--app-radius-md)] border-2 border-[var(--app-border-strong)] bg-[var(--app-field-bg)] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <input
            id="other-code"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="ABCD-EFGH-IJ"
            autoCapitalize="characters"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-base font-semibold text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-text)]"
          />
          <button
            type="button"
            onClick={() => void paste()}
            aria-label="Colar"
            className="-mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-button-muted)] text-[var(--app-gold-accent)] outline-none transition-colors hover:bg-[var(--app-button-muted-hover)] hover:text-[var(--app-gold-strong)] focus-visible:ring-2 focus-visible:ring-[var(--app-border)]"
          >
            <ClipboardPasteIcon className="size-5" />
          </button>
        </div>
        <p className="pl-1 text-xs font-semibold leading-relaxed text-[var(--app-muted-text)]">
          O outro álbum precisa ter a comparação pública ativada.
        </p>
      </div>

      <Button
        type="button"
        size="lg"
        variant="outline"
        className={GOLD_OUTLINE_BUTTON_CLASS}
        onClick={submitCode}
      >
        <ArrowLeftRightIcon className="size-5" />
        Comparar álbuns
      </Button>
      <Button
        type="button"
        size="lg"
        variant="outline"
        className={GOLD_OUTLINE_BUTTON_CLASS}
        onClick={() => setShareTradeQrOpen(true)}
      >
        <QrCodeIcon className="size-5" />
        Meu QR de troca
      </Button>
      <Dialog open={shareTradeQrOpen} onOpenChange={setShareTradeQrOpen}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto border-[var(--app-border)] bg-[var(--app-dialog-bg)] text-[var(--app-dialog-text)] ring-[var(--app-border)]">
          <DialogHeader>
            <DialogTitle>QR de troca</DialogTitle>
            <DialogDescription className="text-[var(--app-muted-text)]">
              Mostre para outra pessoa comparar as repetidas dela com o seu
              álbum.
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
    </div>
  );
}

function CompareView({
  session,
  otherCode,
  onClear,
}: {
  session: AlbumSession;
  otherCode: string;
  onClear: () => void;
}) {
  // A failed compare (bad / disabled / mismatched code) throws here and is
  // caught by the surrounding ErrorBoundary, scoping the error to this region.
  const compare = useQuery(api.compare.compareWithAlbum, {
    myCode: session.code,
    myWriteKey: session.writeKey,
    otherCode,
  });

  // `applyDelta` is stable across renders (memoized in useStickerActions), so the
  // memoized SectionBlock list items don't re-render on every parent update.
  const { applyDelta } = useStickerActions(session);

  const markTrade = useCallback(
    async (row: Row, kind: TradeKind) => {
      try {
        await applyDelta(row.key, kind === "iGive" ? -1 : 1);
        toast.success(
          kind === "iGive"
            ? `Você deu ${row.sectionId} #${row.number}.`
            : `Você recebeu ${row.sectionId} #${row.number}.`,
        );
      } catch (e) {
        toast.error(errorMessage(e));
      }
    },
    [applyDelta],
  );

  const theyCanGiveMe = useMemo<Row[]>(
    () => (compare ? Array.from(compare.theyCanGiveMe).sort(sortRows) : []),
    [compare],
  );
  const iCanGive = useMemo<Row[]>(
    () => (compare ? Array.from(compare.iCanGive).sort(sortRows) : []),
    [compare],
  );

  const theyByS = useMemo(() => groupBySection(theyCanGiveMe), [theyCanGiveMe]);
  const meByS = useMemo(() => groupBySection(iCanGive), [iCanGive]);

  if (compare === undefined) {
    return (
      <div className={CONTAINER_CLASS}>
        <section className="rounded-[var(--app-radius-xl)] border-2 border-[var(--app-border)] bg-[var(--app-card)] p-4 shadow-[var(--app-shadow-lg)]">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-gold)] text-[var(--app-gold-accent)]">
              <Loader2Icon className="size-6 animate-spin" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-tight tracking-normal text-[var(--app-text)]">
                Comparando
              </h1>
              <p className="mt-1 text-sm font-semibold text-[var(--app-muted-text)]">
                Buscando as trocas possíveis entre os álbuns.
              </p>
            </div>
          </div>
        </section>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className={`${GOLD_OUTLINE_BUTTON_CLASS} w-full`}
          onClick={onClear}
        >
          Trocar de álbum
        </Button>
      </div>
    );
  }

  return (
    <div className={CONTAINER_CLASS}>
      <TabHeaderCard
        icon={ArrowLeftRightIcon}
        title={compare.otherAlbum.name}
        subtitle={
          <div className="flex flex-col gap-2.5">
            <span className="block truncate font-mono text-xs font-bold text-[var(--app-muted-text)]">
              {compare.otherAlbum.code}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <CompareStat
                label="Coladas"
                value={compare.otherAlbum.ownedCount}
              />
              <CompareStat
                label="Repetidas"
                value={compare.otherAlbum.duplicateCount}
              />
            </div>
          </div>
        }
      />

      <Button
        type="button"
        size="lg"
        variant="outline"
        className={`${GOLD_OUTLINE_BUTTON_CLASS} w-full`}
        onClick={onClear}
      >
        Trocar de álbum
      </Button>

      <Tabs defaultValue="receive">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] bg-[var(--app-surface-strong)] p-1 shadow-[var(--app-shadow-md)]">
          <TabsTrigger
            value="receive"
            className="rounded-xl text-sm font-black text-[var(--app-muted-text)] data-[state=active]:border data-[state=active]:border-[var(--app-border)] data-[state=active]:bg-[var(--app-nav-active)] data-[state=active]:text-[var(--app-nav-active-text)]"
          >
            Eles têm ({theyCanGiveMe.length})
          </TabsTrigger>
          <TabsTrigger
            value="give"
            className="rounded-xl text-sm font-black text-[var(--app-muted-text)] data-[state=active]:border data-[state=active]:border-[var(--app-border)] data-[state=active]:bg-[var(--app-nav-active)] data-[state=active]:text-[var(--app-nav-active-text)]"
          >
            Eu tenho ({iCanGive.length})
          </TabsTrigger>
        </TabsList>

        <p className="px-1 pt-2 text-xs font-semibold leading-relaxed text-[var(--app-muted-text)]">
          As marcações atualizam só o seu álbum.
        </p>

        <TabsContent value="receive" className="flex flex-col gap-2 pt-3">
          {theyCanGiveMe.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRightIcon}
              description="Nenhuma figurinha que você precisa entre as repetidas deles."
            />
          ) : (
            [...theyByS.entries()].map(([sid, rows]) => (
              <SectionBlock
                key={sid}
                sectionId={sid}
                rows={rows}
                kind="iReceive"
                onAction={(row, kind) => void markTrade(row, kind)}
              />
            ))
          )}
        </TabsContent>
        <TabsContent value="give" className="flex flex-col gap-2 pt-3">
          {iCanGive.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRightIcon}
              description="Nenhuma das suas repetidas é faltante para eles."
            />
          ) : (
            [...meByS.entries()].map(([sid, rows]) => (
              <SectionBlock
                key={sid}
                sectionId={sid}
                rows={rows}
                kind="iGive"
                onAction={(row, kind) => void markTrade(row, kind)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CompareStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-field-bg)] px-3 py-2">
      <p className="text-2xs font-black uppercase leading-none tracking-normal text-[var(--app-gold-accent)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-black leading-none text-[var(--app-text)] tabular-nums">
        {value}
      </p>
    </div>
  );
}

const SectionBlock = memo(function SectionBlock({
  sectionId,
  rows,
  kind,
  onAction,
}: {
  sectionId: string;
  rows: Row[];
  kind: TradeKind;
  onAction: (row: Row, kind: TradeKind) => void;
}) {
  const section = sectionTemplate(sectionId);
  const title = sectionTitle(sectionId);
  const theme = getTeamTheme(sectionId);
  const isReceive = kind === "iReceive";
  const actionLabel = isReceive ? "Recebi" : "Dei";
  const qtyLabel = isReceive ? "deles" : "suas";

  return (
    <section
      style={sectionStyle(theme)}
      className="team-card relative overflow-hidden rounded-[var(--app-radius-lg)] border-2 p-2 shadow-[var(--app-shadow-md)]"
    >
      <TeamBackgroundForms />
      <div className="relative z-10 flex min-h-10 items-center gap-2 px-1.5 pb-2">
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/45 bg-white shadow-[var(--app-shadow-sm)]">
          {section ? (
            <SectionIcon section={section} />
          ) : (
            <span className="text-2xs font-black leading-none tracking-normal text-black">
              {sectionId.slice(0, 2)}
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="trade-team-label country-name-outline text-base font-black leading-none tracking-normal text-[var(--team-ink)]">
            {sectionId}
          </span>
          {title !== sectionId && (
            <span className="trade-team-label country-name-outline hidden truncate text-xs font-bold leading-none text-[var(--team-ink)] opacity-80 min-[380px]:inline">
              {title}
            </span>
          )}
        </span>
        <Badge className="h-7 rounded-full border border-white/30 bg-[var(--app-scrim)] px-2.5 text-sm font-black text-white shadow-none">
          {rows.length}
        </Badge>
      </div>

      <div className="relative z-10 flex flex-col gap-2 pb-1">
        {rows.map((r) => (
          <div
            key={r.key}
            className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-white/22 bg-[var(--app-scrim)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <StickerSlot
              sectionId={sectionId}
              number={r.number}
              theme={theme}
              owned={false}
              missing={false}
            />
            <div className="min-w-0">
              <p className="country-name-outline text-base font-black leading-none text-white tabular-nums">
                #{r.number}
              </p>
              <Badge className="mt-1 h-6 rounded-full border border-white/25 bg-[var(--app-scrim)] px-2 text-xs font-black text-white shadow-none tabular-nums">
                x{isReceive ? r.theirDuplicateQuantity : r.myDuplicateQuantity}{" "}
                {qtyLabel}
              </Badge>
            </div>
            <Button
              type="button"
              size="sm"
              variant={isReceive ? "default" : "outline"}
              className={
                isReceive
                  ? "h-10 rounded-xl bg-[var(--app-success)] px-3 text-sm font-black text-[var(--app-on-accent)] shadow-none hover:bg-[var(--app-success-strong)]"
                  : "h-10 rounded-xl border-white/35 bg-black/24 px-3 text-sm font-black text-white hover:bg-white/12 hover:text-white"
              }
              onClick={() => onAction(r, kind)}
            >
              {isReceive ? (
                <PlusIcon className="size-4" />
              ) : (
                <MinusIcon className="size-4" />
              )}
              {actionLabel}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
});
