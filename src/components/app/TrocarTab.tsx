import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeftRightIcon,
  ClipboardPasteIcon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AlbumSession } from "@/lib/albumSession";
import { pasteFromClipboard } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";
import { normalizeAlbumCode, parseFullAccessCode } from "@convex/lib/access";
import { WC_2026_TEMPLATE } from "@convex/lib/templates";
import { TeamBackgroundForms } from "./TeamBackgroundForms";
import {
  getTeamTheme,
  SectionIcon,
  sectionStyle,
  slotStyle,
} from "./teamVisuals";

type Props = { session: AlbumSession };

type Row = {
  key: string;
  sectionId: string;
  number: string;
  myDuplicateQuantity: number;
  theirDuplicateQuantity: number;
};

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

export function TrocarTab({ session }: Props) {
  const [draft, setDraft] = useState("");
  const [otherCode, setOtherCode] = useState<string | null>(null);

  const compare = useQuery(
    api.compare.compareWithAlbum,
    otherCode
      ? {
          myCode: session.code,
          myWriteKey: session.writeKey,
          otherCode,
        }
      : "skip",
  );

  const addCopies = useMutation(api.stickers.addCopies);

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

  function clear() {
    setOtherCode(null);
    setDraft("");
  }

  async function paste() {
    try {
      const v = await pasteFromClipboard();
      setDraft(v);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function markTrade(row: Row, kind: "iGive" | "iReceive") {
    try {
      await addCopies({
        code: session.code,
        writeKey: session.writeKey,
        stickerKey: row.key,
        delta: kind === "iGive" ? -1 : 1,
      });
      toast.success(
        kind === "iGive"
          ? `Você deu ${row.sectionId} #${row.number}.`
          : `Você recebeu ${row.sectionId} #${row.number}.`,
      );
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

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

  if (!otherCode) {
    return (
      <div className="trocar-tab mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-24 pt-4">
        <section className="rounded-[1.35rem] border-2 border-[#d6b45d] bg-[#1b1b1b]/95 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#d6b45d]/55 bg-[#2b2619] text-[#d6b45d]">
              <ArrowLeftRightIcon className="size-6" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="truncate text-[18px] font-semibold leading-tight tracking-normal text-white">
                Trocar
              </h1>
              <p className="mt-1 text-[13px] font-semibold leading-relaxed text-white/72">
                Cole o código público de outro álbum para comparar as repetidas.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="other-code"
            className="pl-1 text-[13px] font-black leading-none tracking-normal text-white"
          >
            Código público
          </label>
          <div className="flex h-14 items-center gap-3 rounded-2xl border-2 border-[#d6b45d]/75 bg-[#171717]/95 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <input
              id="other-code"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="ABCD-EFGH-IJ"
              autoCapitalize="characters"
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-white/45"
            />
            <button
              type="button"
              onClick={() => void paste()}
              aria-label="Colar"
              className="-mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#d6b45d]/45 bg-black/20 text-[#d6b45d] outline-none transition-colors hover:bg-[#d6b45d]/10 hover:text-[#f4d77c] focus-visible:ring-2 focus-visible:ring-[#d6b45d]/35"
            >
              <ClipboardPasteIcon className="size-5" />
            </button>
          </div>
          <p className="pl-1 text-[12px] font-semibold leading-relaxed text-white/62">
            O outro álbum precisa ter a comparação pública ativada.
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 rounded-2xl border-[#d6b45d]/65 bg-black/20 text-[15px] font-black text-[#d6b45d] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-[#d6b45d]/10 hover:text-[#f4d77c]"
          onClick={submitCode}
        >
          <ArrowLeftRightIcon className="size-5" />
          Comparar álbuns
        </Button>
      </div>
    );
  }

  if (compare === undefined) {
    return (
      <div className="trocar-tab mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-24 pt-4">
        <section className="rounded-[1.35rem] border-2 border-[#d6b45d] bg-[#1b1b1b]/95 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#d6b45d]/55 bg-[#2b2619] text-[#d6b45d]">
              <Loader2Icon className="size-6 animate-spin" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[18px] font-semibold leading-tight tracking-normal text-white">
                Comparando
              </h1>
              <p className="mt-1 text-[13px] font-semibold text-white/72">
                Buscando as trocas possíveis entre os álbuns.
              </p>
            </div>
          </div>
        </section>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-12 rounded-2xl border-[#d6b45d]/65 bg-black/20 text-[15px] font-black text-[#d6b45d] hover:bg-[#d6b45d]/10 hover:text-[#f4d77c]"
          onClick={clear}
        >
          Trocar de álbum
        </Button>
      </div>
    );
  }

  return (
    <div className="trocar-tab mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-24 pt-4">
      <section className="rounded-[1.35rem] border-2 border-[#d6b45d] bg-[#1b1b1b]/95 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#d6b45d]/55 bg-[#2b2619] text-[#d6b45d]">
            <ArrowLeftRightIcon className="size-6" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="truncate text-[18px] font-semibold leading-tight tracking-normal text-white">
              {compare.otherAlbum.name}
            </h1>
            <p className="mt-1 truncate font-mono text-[12px] font-bold text-white/62">
              {compare.otherAlbum.code}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-[#d6b45d]/35 bg-black/25 px-3 py-2">
            <p className="text-[10px] font-black uppercase leading-none tracking-normal text-[#d6b45d]">
              Coladas
            </p>
            <p className="mt-1 text-[18px] font-black leading-none text-white tabular-nums">
              {compare.otherAlbum.ownedCount}
            </p>
          </div>
          <div className="rounded-2xl border border-[#d6b45d]/35 bg-black/25 px-3 py-2">
            <p className="text-[10px] font-black uppercase leading-none tracking-normal text-[#d6b45d]">
              Repetidas
            </p>
            <p className="mt-1 text-[18px] font-black leading-none text-white tabular-nums">
              {compare.otherAlbum.duplicateCount}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="mt-3 h-11 w-full rounded-2xl border-[#d6b45d]/65 bg-black/20 text-[14px] font-black text-[#d6b45d] hover:bg-[#d6b45d]/10 hover:text-[#f4d77c]"
          onClick={clear}
        >
          Trocar de álbum
        </Button>
      </section>

      <Tabs defaultValue="receive">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl border border-[#d6b45d]/35 bg-[#151515]/95 p-1 shadow-[0_8px_26px_rgba(0,0,0,0.28)]">
          <TabsTrigger
            value="receive"
            className="rounded-xl text-[12px] font-black text-white/62 data-[state=active]:border data-[state=active]:border-[#d6b45d]/45 data-[state=active]:bg-[linear-gradient(180deg,rgba(19,174,91,0.34),rgba(16,16,16,0.45))] data-[state=active]:text-[#35e66f]"
          >
            Eles têm ({theyCanGiveMe.length})
          </TabsTrigger>
          <TabsTrigger
            value="give"
            className="rounded-xl text-[12px] font-black text-white/62 data-[state=active]:border data-[state=active]:border-[#d6b45d]/45 data-[state=active]:bg-[linear-gradient(180deg,rgba(19,174,91,0.34),rgba(16,16,16,0.45))] data-[state=active]:text-[#35e66f]"
          >
            Eu tenho ({iCanGive.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="receive" className="flex flex-col gap-2 pt-3">
          {theyCanGiveMe.length === 0 ? (
            <EmptyMsg text="Nenhuma figurinha que você precisa entre as repetidas deles." />
          ) : (
            [...theyByS.entries()].map(([sid, rows]) => (
              <SectionBlock
                key={sid}
                sectionId={sid}
                rows={rows}
                actionLabel="Recebi"
                qtyLabel="deles"
                showQty={(r) => r.theirDuplicateQuantity}
                onAction={(r) => void markTrade(r, "iReceive")}
              />
            ))
          )}
        </TabsContent>
        <TabsContent value="give" className="flex flex-col gap-2 pt-3">
          {iCanGive.length === 0 ? (
            <EmptyMsg text="Nenhuma das suas repetidas é faltante para eles." />
          ) : (
            [...meByS.entries()].map(([sid, rows]) => (
              <SectionBlock
                key={sid}
                sectionId={sid}
                rows={rows}
                actionLabel="Dei"
                qtyLabel="suas"
                showQty={(r) => r.myDuplicateQuantity}
                onAction={(r) => void markTrade(r, "iGive")}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <div className="rounded-[1.35rem] border-2 border-[#d6b45d]/65 bg-[#171717]/95 px-5 py-8 text-center shadow-[0_14px_36px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#d6b45d]/50 bg-[#2b2619] text-[#d6b45d]">
        <ArrowLeftRightIcon className="size-7" />
      </div>
      <p className="mx-auto mt-4 max-w-[280px] text-[13px] font-semibold leading-relaxed text-white/68">
        {text}
      </p>
    </div>
  );
}

function SectionBlock({
  sectionId,
  rows,
  actionLabel,
  qtyLabel,
  showQty,
  onAction,
}: {
  sectionId: string;
  rows: Row[];
  actionLabel: string;
  qtyLabel: string;
  showQty: (r: Row) => number;
  onAction: (r: Row) => void;
}) {
  const section = sectionTemplate(sectionId);
  const title = sectionTitle(sectionId);
  const theme = getTeamTheme(sectionId);

  return (
    <section
      style={sectionStyle(theme)}
      className="team-card relative overflow-hidden rounded-[1.15rem] border-2 p-2 shadow-[0_6px_16px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.12)]"
    >
      <TeamBackgroundForms />
      <div className="relative z-10 flex min-h-10 items-center gap-2 px-1.5 pb-2">
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/45 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.28)]">
          {section ? (
            <SectionIcon section={section} />
          ) : (
            <span className="text-[9px] font-black leading-none tracking-normal text-[#101010]">
              {sectionId.slice(0, 2)}
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="trade-team-label country-name-outline text-[15px] font-black leading-none tracking-normal text-white">
            {sectionId}
          </span>
          {title !== sectionId && (
            <span className="trade-team-label country-name-outline hidden truncate text-[11px] font-bold leading-none text-white/78 min-[380px]:inline">
              {title}
            </span>
          )}
        </span>
        <Badge className="h-7 rounded-full border border-white/30 bg-black/42 px-2.5 text-[12px] font-black text-white shadow-none">
          {rows.length}
        </Badge>
      </div>

      <div className="relative z-10 flex flex-col gap-2 pb-1">
        {rows.map((r) => (
          <div
            key={r.key}
            className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-white/22 bg-black/38 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <div
              style={slotStyle(theme, true)}
              className="sticker-slot-lite relative flex aspect-[3/4] w-full overflow-hidden rounded-xl border-2 text-[12px] font-black leading-none tracking-normal shadow-[0_2px_6px_rgba(0,0,0,0.22)]"
            >
              <span aria-hidden="true" className="sticker-slot-label">
                <span>{sectionId}</span>
                <span>{r.number}</span>
              </span>
            </div>
            <div className="min-w-0">
              <p className="country-name-outline text-[15px] font-black leading-none text-white tabular-nums">
                #{r.number}
              </p>
              <Badge className="mt-1 h-6 rounded-full border border-white/25 bg-black/45 px-2 text-[11px] font-black text-white shadow-none tabular-nums">
                x{showQty(r)} {qtyLabel}
              </Badge>
            </div>
            <Button
              type="button"
              size="sm"
              variant={actionLabel === "Recebi" ? "default" : "outline"}
              className={
                actionLabel === "Recebi"
                  ? "h-10 rounded-xl bg-[#13c95f] px-3 text-[12px] font-black text-white shadow-none hover:bg-[#14b957]"
                  : "h-10 rounded-xl border-white/35 bg-black/24 px-3 text-[12px] font-black text-white hover:bg-white/12 hover:text-white"
              }
              onClick={() => onAction(r)}
            >
              {actionLabel === "Recebi" ? (
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
}
