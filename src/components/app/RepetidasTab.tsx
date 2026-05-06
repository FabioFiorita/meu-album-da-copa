import { useMutation, useQuery } from "convex/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  FlipHorizontalIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  Share2Icon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlbumSession } from "@/lib/albumSession";
import { copyText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";
import { encodeDuplicatesPayloadV1 } from "@/lib/sharePayloads";
import { normalizeAlbumCode } from "@convex/lib/access";
import { WC_2026_TEMPLATE } from "@convex/lib/templates";
import {
  getTeamTheme,
  SectionIcon,
  sectionStyle,
  slotStyle,
} from "./teamVisuals";

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
  const sorted = [...rows].sort(sortByNumber);
  return `${sectionId}: ${sorted.map((r) => r.number).join(", ")}`;
}

export function RepetidasTab({ session }: Props) {
  const snapshot = useQuery(api.albums.getPrivateSnapshot, {
    code: session.code,
    writeKey: session.writeKey,
  });
  const addCopies = useMutation(api.stickers.addCopies);
  const [q, setQ] = useState("");
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [closingSections, setClosingSections] = useState<string[]>([]);
  const closeTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(closeTimers.current).forEach(window.clearTimeout);
    };
  }, []);

  const dupRows: DupRow[] = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.stickers
      .filter((s) => s.count >= 2)
      .map((s) => ({
        key: s.key,
        sectionId: s.sectionId,
        number: s.number,
        count: s.count,
      }));
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

  async function onDelta(key: string, delta: number) {
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

  async function copySection(sectionId: string) {
    const rows = dupBySection.get(sectionId);
    if (!rows || rows.length === 0) return;
    try {
      await copyText(formatSectionLine(sectionId, rows));
      toast.success(`${sectionId} copiado.`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function copyAllAsText() {
    if (dupBySection.size === 0) return;
    const lines = WC_2026_TEMPLATE.sections
      .filter((s) => dupBySection.has(s.id))
      .map((s) => formatSectionLine(s.id, dupBySection.get(s.id)!));
    try {
      await copyText(lines.join("\n"));
      toast.success("Lista de repetidas copiada.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function exportEncodedDupes() {
    if (!snapshot) return;
    const duplicates = snapshot.stickers
      .filter((s) => s.count > 1)
      .map((s) => ({ key: s.key, quantity: s.count - 1 }));
    const payload = encodeDuplicatesPayloadV1({
      type: "duplicates",
      version: 1,
      templateId: "wc2026",
      albumCode: session.code,
      generatedAt: Date.now(),
      duplicates,
    });
    try {
      await copyText(payload);
      toast.success("Payload FIGUS_DUPLICATES copiado.");
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

  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-24 pt-4">
      <section className="rounded-[1.35rem] border-2 border-[#d6b45d] bg-[#1b1b1b]/95 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#d6b45d]/55 bg-[#2b2619] text-[#d6b45d]">
            <FlipHorizontalIcon className="size-6" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="truncate text-[18px] font-black leading-tight tracking-normal text-white">
              Repetidas
            </h1>
            <p className="mt-1 text-[13px] font-semibold text-white/72">
              {totalDupes} figurinha{totalDupes === 1 ? "" : "s"} para troca
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              aria-label="Compartilhar repetidas"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#d6b45d]/55 bg-black/25 text-[#d6b45d] outline-none transition-colors hover:bg-[#d6b45d]/10 hover:text-[#f4d77c] focus-visible:ring-2 focus-visible:ring-[#d6b45d]/35"
            >
              <Share2Icon />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-[#d6b45d]/35 bg-[#171717] text-white"
            >
              <DropdownMenuItem onClick={() => void sharePublic()}>
                Código público (comparação)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportEncodedDupes()}>
                Payload FIGUS_DUPLICATES
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button
          type="button"
          size="lg"
          className="mt-4 h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#16d866,#0fb653)] text-[15px] font-black text-white shadow-[0_8px_22px_rgba(16,190,88,0.24)] hover:bg-[#14c75d]"
          onClick={() => void copyAllAsText()}
          disabled={dupBySection.size === 0}
        >
          <CopyIcon />
          Copiar tudo
        </Button>
      </section>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="search-dup"
          className="pl-1 text-[13px] font-black leading-none tracking-normal text-white"
        >
          Buscar países
        </label>
        <div className="flex h-14 items-center gap-3 rounded-2xl border-2 border-[#d6b45d]/75 bg-[#171717]/95 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <SearchIcon className="size-5 shrink-0 text-[#d6b45d]" />
          <input
            id="search-dup"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar países..."
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-white/45"
          />
        </div>
      </div>

      {!snapshot ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 rounded-2xl bg-[#171717]" />
          <Skeleton className="h-14 rounded-2xl bg-[#171717]" />
          <Skeleton className="h-48 rounded-[1.15rem] bg-[#171717]" />
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-[1.35rem] border-2 border-[#d6b45d]/65 bg-[#171717]/95 px-5 py-8 text-center shadow-[0_14px_36px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#d6b45d]/50 bg-[#2b2619] text-[#d6b45d]">
            <FlipHorizontalIcon className="size-7" />
          </div>
          <h2 className="mt-4 text-[18px] font-black leading-tight text-white">
            Nenhuma repetida
          </h2>
          <p className="mx-auto mt-2 max-w-[280px] text-[13px] font-semibold leading-relaxed text-white/68">
            Quando tiver figurinhas sobrando, elas aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sections.map((sec) => {
            const rows = dupBySection.get(sec.id) ?? [];
            const totalExtras = rows.reduce((s, r) => s + (r.count - 1), 0);
            const summary = rows.map((r) => r.number).join(", ");
            const title = sec.title !== sec.id ? sec.title : "";
            const theme = getTeamTheme(sec.id);
            const isExpanded = openSections.includes(sec.id);
            const isClosing = closingSections.includes(sec.id);
            const shouldRenderRows = isExpanded || isClosing;

            return (
              <section
                key={sec.id}
                data-expanded={isExpanded ? "true" : "false"}
                style={sectionStyle(theme)}
                className="team-card relative overflow-hidden rounded-[1.15rem] border-2 px-2 shadow-[0_6px_16px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.12)]"
              >
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
                    x{totalExtras}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUpIcon className="size-4 shrink-0 text-white" />
                  ) : (
                    <ChevronDownIcon className="size-4 shrink-0 text-white" />
                  )}
                </button>

                {shouldRenderRows && (
                  <div
                    className="country-stickers-panel relative z-10"
                    data-state={isExpanded ? "open" : "closing"}
                  >
                    <div className="country-stickers-panel-inner pb-4 pt-1">
                      <div className="mb-3 flex items-center justify-between gap-2 px-1">
                        <p className="country-name-outline min-w-0 truncate text-[11px] font-black leading-none text-white/86 tabular-nums">
                          {summary}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 shrink-0 rounded-xl px-2 text-[11px] font-black text-white hover:bg-white/12 hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            void copySection(sec.id);
                          }}
                        >
                          <CopyIcon className="size-3.5" />
                          Copiar
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 px-1">
                        {rows.map((r) => (
                          <div key={r.key} className="min-w-0">
                            <div
                              style={slotStyle(theme, true)}
                              className="sticker-slot-lite relative flex aspect-[3/4] w-full overflow-hidden rounded-xl border-2 text-[12px] font-black leading-none tracking-normal shadow-[0_2px_6px_rgba(0,0,0,0.22)]"
                            >
                              <span
                                aria-hidden="true"
                                className="sticker-slot-label"
                              >
                                <span>{sec.id}</span>
                                <span>{r.number}</span>
                              </span>
                              <Badge className="absolute bottom-1 right-1 z-20 h-5 rounded-full border border-white/20 bg-black/55 px-1.5 text-[10px] font-black text-white shadow-none">
                                x{r.count - 1}
                              </Badge>
                            </div>
                            <div className="mt-1.5 grid grid-cols-2 gap-1">
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                className="h-8 w-full rounded-xl border-white/35 bg-black/24 text-white hover:bg-white/12 hover:text-white"
                                aria-label="Menos uma repetida"
                                onClick={() => void onDelta(r.key, -1)}
                              >
                                <MinusIcon className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon-sm"
                                className="h-8 w-full rounded-xl bg-[#13c95f] text-white shadow-none hover:bg-[#14b957]"
                                aria-label="Mais uma repetida"
                                onClick={() => void onDelta(r.key, 1)}
                              >
                                <PlusIcon className="size-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
