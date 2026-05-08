import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2Icon,
  Repeat2Icon,
  SearchIcon,
  ZapIcon,
} from "lucide-react";
import { type CSSProperties, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AlbumSession } from "@/lib/albumSession";
import { errorMessage } from "@/lib/errors";
import { buildStickerKey } from "@convex/lib/stickerKeys";
import { stickerExists, WC_2026_TEMPLATE } from "@convex/lib/templates";
import { TeamBackgroundForms } from "./TeamBackgroundForms";
import {
  getTeamTheme,
  SectionIcon,
  sectionStyle,
  slotStyle,
} from "./teamVisuals";

type Props = { session: AlbumSession };

const COUNTRY_INPUTS = [0, 1, 2] as const;
const NUMBER_INPUTS = [0, 1] as const;
const inputCellClass =
  "h-14 min-w-0 rounded-2xl border-2 border-[#d6b45d]/65 bg-black/28 text-center text-[21px] font-black uppercase leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_18px_rgba(0,0,0,0.18)] outline-none transition-colors placeholder:text-white/28 focus:border-[#f4d77c] focus:bg-black/38 focus:ring-2 focus:ring-[#d6b45d]/25";

export function BuscaTab({ session }: Props) {
  const snapshot = useQuery(api.albums.getPrivateSnapshot, {
    code: session.code,
    writeKey: session.writeKey,
  });
  const markQuick = useMutation(api.stickers.markQuick);
  const [country, setCountry] = useState("");
  const [num, setNum] = useState("");
  const countryInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const numberInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const resolved = useMemo<
    | null
    | {
        error: string;
        key?: undefined;
        sectionId?: undefined;
        number?: undefined;
      }
    | { error?: undefined; key: string; sectionId: string; number: string }
  >(() => {
    const c = country.trim().toUpperCase();
    const n = num.trim();
    if (c.length !== 3 || n.length === 0) return null;
    try {
      const key = buildStickerKey("wc2026", c, n);
      if (!stickerExists("wc2026", key))
        return { error: "Figurinha inexistente." };
      return { key, sectionId: c, number: n };
    } catch {
      return { error: "Combinação inválida." };
    }
  }, [country, num]);

  const count =
    resolved && resolved.key && snapshot
      ? (snapshot.stickers.find((s) => s.key === resolved.key)?.count ?? 0)
      : 0;
  const resolvedSection =
    resolved && resolved.key
      ? (WC_2026_TEMPLATE.sections.find((s) => s.id === resolved.sectionId) ??
        null)
      : null;
  const resolvedTheme = getTeamTheme(resolved?.sectionId ?? "");
  const previewSectionId = country.trim().toUpperCase();
  const previewSection =
    previewSectionId.length === 3
      ? (WC_2026_TEMPLATE.sections.find((s) => s.id === previewSectionId) ??
        null)
      : null;
  const previewTheme = getTeamTheme(previewSection?.id ?? "");
  const previewCountry = (country.toUpperCase() + "---").slice(0, 3);
  const previewNumber = num || "--";
  const isComplete = country.trim().length === 3 && num.trim().length > 0;
  const errorMessageText =
    isComplete && resolved?.error ? resolved.error : null;
  const placeholderCardStyle = previewSection
    ? sectionStyle(previewTheme)
    : undefined;
  const placeholderSlotStyle = previewSection
    ? ({
        ...slotStyle(previewTheme, false),
        "--slot-ink": "#111111",
      } as CSSProperties)
    : ({ "--slot-ink": "#111111" } as CSSProperties);
  const statusLabel = !snapshot
    ? "Sincronizando..."
    : count === 0
      ? "Faltante"
      : count === 1
        ? "Possuída"
        : `${count} cópias`;

  async function runMark(mode: "owned" | "duplicate") {
    if (!resolved || !resolved.key) return;
    try {
      await markQuick({
        code: session.code,
        writeKey: session.writeKey,
        sectionId: resolved.sectionId!,
        number: resolved.number!,
        mode,
      });
      toast.success(mode === "owned" ? "Possuída." : "Repetida ajustada.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  function setCountryChar(index: number, value: string) {
    const padded = (country + "   ").slice(0, 3).split("");
    padded[index] = value;
    setCountry(padded.join("").replace(/\s/g, "").slice(0, 3));
  }

  function setNumberChar(index: number, value: string) {
    const padded = (num + "  ").slice(0, 2).split("");
    padded[index] = value;
    setNum(padded.join("").replace(/\s/g, "").slice(0, 2));
  }

  function focusCountryInput(index: number) {
    window.requestAnimationFrame(() =>
      countryInputRefs.current[index]?.focus(),
    );
  }

  function focusNumberInput(index: number) {
    window.requestAnimationFrame(() => numberInputRefs.current[index]?.focus());
  }

  return (
    <div className="busca-tab mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-24 pt-4">
      <section className="relative overflow-hidden rounded-[1.35rem] border-2 border-[#d6b45d] bg-[#1b1b1b]/95 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="absolute -right-10 -top-12 size-32 rounded-full bg-[#d6b45d]/12 blur-2xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#d6b45d]/55 bg-[#2b2619] text-[#d6b45d]">
            <SearchIcon className="size-6" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="mb-1 flex items-center gap-2">
              <h1 className="truncate text-[18px] font-black leading-tight tracking-normal text-white">
                Busca+
              </h1>
              <Badge className="h-6 rounded-full border border-[#d6b45d]/45 bg-black/24 px-2 text-[10px] font-black uppercase tracking-normal text-[#f4d77c] shadow-none">
                Rápida
              </Badge>
            </div>
            <p className="text-[13px] font-semibold leading-snug text-white/72">
              Ache a figurinha pelo código e atualize o álbum em um toque.
            </p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.35rem] border-2 border-[#d6b45d]/75 bg-[#171717]/95 p-4 shadow-[0_14px_36px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="absolute inset-x-6 top-5 h-16 rounded-full bg-[#d6b45d]/8 blur-xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-[#d6b45d]/45 bg-[#2b2619] text-[#d6b45d]">
              <ZapIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-[14px] font-black leading-none text-white">
                Código da figurinha
              </h2>
              <p className="mt-1 text-[11px] font-bold leading-none text-white/50">
                País + número
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-5 rounded-[1.15rem] border border-white/10 bg-black/18 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="min-w-0">
              <label className="pl-1 text-[11px] font-black uppercase leading-none tracking-normal text-white/62">
                País
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {COUNTRY_INPUTS.map((i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      countryInputRefs.current[i] = el;
                    }}
                    maxLength={1}
                    aria-label={`Letra ${i + 1} do país`}
                    className={inputCellClass}
                    value={country[i] ?? ""}
                    onKeyDown={(e) => {
                      if (e.key !== "Backspace" || country[i]) return;
                      e.preventDefault();
                      if (i > 0) {
                        setCountryChar(i - 1, "");
                        focusCountryInput(i - 1);
                        return;
                      }
                      if (num.length > 0) setNum("");
                    }}
                    onChange={(e) => {
                      const ch = e.target.value
                        .toUpperCase()
                        .replace(/[^A-Za-z]/g, "");
                      const value = ch.slice(-1) || "";
                      const padded = (country + "   ").slice(0, 3).split("");
                      padded[i] = value;
                      const next = padded
                        .join("")
                        .replace(/\s/g, "")
                        .slice(0, 3);
                      setCountry(next);
                      if (!value) return;
                      if (i < 2) {
                        focusCountryInput(i + 1);
                      } else {
                        focusNumberInput(0);
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="w-[7.25rem]">
              <label className="pl-1 text-[11px] font-black uppercase leading-none tracking-normal text-white/62">
                Número
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {NUMBER_INPUTS.map((i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      numberInputRefs.current[i] = el;
                    }}
                    maxLength={1}
                    inputMode="numeric"
                    aria-label={`Dígito ${i + 1} do número`}
                    className={inputCellClass}
                    value={num[i] ?? ""}
                    onKeyDown={(e) => {
                      if (e.key !== "Backspace" || num[i]) return;
                      e.preventDefault();
                      if (i > 0) {
                        setNumberChar(i - 1, "");
                        focusNumberInput(i - 1);
                      } else {
                        setCountryChar(2, "");
                        focusCountryInput(2);
                      }
                    }}
                    onChange={(e) => {
                      const ch = e.target.value.replace(/\D/g, "");
                      const value = ch.slice(-1) || "";
                      const padded = (num + "  ").slice(0, 2).split("");
                      padded[i] = value;
                      const next = padded
                        .join("")
                        .replace(/\s/g, "")
                        .slice(0, 2);
                      setNum(next);
                      if (value && i < 1) focusNumberInput(i + 1);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {!resolved?.key ? (
        <>
          <section
            style={placeholderCardStyle}
            className={
              previewSection
                ? "team-card relative overflow-hidden rounded-[1.35rem] border-2 p-5 shadow-[0_14px_36px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.12)]"
                : "relative overflow-hidden rounded-[1.35rem] border-2 border-[#d6b45d]/65 bg-[#171717]/95 p-5 shadow-[0_14px_36px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]"
            }
          >
            {previewSection ? (
              <>
                <TeamBackgroundForms />
                <div className="absolute inset-0 z-[1] bg-black/14" />
              </>
            ) : (
              <div className="absolute -right-12 top-4 size-36 rounded-full bg-[#d6b45d]/9 blur-2xl" />
            )}
            <div className="relative z-10 grid grid-cols-[4.8rem_1fr] items-center gap-4">
              <div
                style={placeholderSlotStyle}
                className={
                  previewSection
                    ? "sticker-slot-lite relative flex aspect-[3/4] w-full overflow-hidden rounded-xl border-2 text-[12px] font-black leading-none tracking-normal shadow-[0_2px_6px_rgba(0,0,0,0.22)]"
                    : "sticker-slot-lite relative flex aspect-[3/4] w-full overflow-hidden rounded-xl border-2 border-[#d6b45d]/55 bg-[#2b2619] text-[12px] font-black leading-none tracking-normal shadow-[0_2px_6px_rgba(0,0,0,0.22)]"
                }
              >
                <span
                  aria-hidden="true"
                  className="sticker-slot-label text-black"
                >
                  <span>{previewCountry}</span>
                  <span>{previewNumber}</span>
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="country-name-outline text-[18px] font-black leading-tight text-white">
                  Digite para buscar
                </h2>
                <p className="country-name-outline mt-2 text-[13px] font-semibold leading-relaxed text-white/74">
                  Use o código da figurinha para ver o status e marcar.
                </p>
              </div>
            </div>
          </section>
          {errorMessageText && (
            <p
              role="alert"
              className="-mt-2 px-4 text-[12px] font-black leading-tight tracking-normal text-[#ff3333]"
            >
              {errorMessageText}
            </p>
          )}
        </>
      ) : resolved && resolved.key ? (
        <section
          style={sectionStyle(resolvedTheme)}
          className="team-card relative overflow-hidden rounded-[1.35rem] border-2 p-5 shadow-[0_14px_36px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.12)]"
        >
          <TeamBackgroundForms />

          <div className="relative z-10 grid grid-cols-[4.8rem_1fr] items-center gap-4">
            <div
              style={slotStyle(resolvedTheme, count > 0)}
              className="sticker-slot-lite relative flex aspect-[3/4] w-full overflow-hidden rounded-xl border-2 text-[12px] font-black leading-none tracking-normal shadow-[0_2px_6px_rgba(0,0,0,0.22)]"
            >
              <span aria-hidden="true" className="sticker-slot-label">
                <span>{resolved.sectionId}</span>
                <span>{resolved.number}</span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/45 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.28)]">
                    {resolvedSection ? (
                      <SectionIcon section={resolvedSection} />
                    ) : (
                      <span className="text-[9px] font-black leading-none text-[#101010]">
                        {resolved.sectionId.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="country-name-outline truncate text-[17px] font-black leading-tight text-white">
                      {resolved.key}
                    </h2>
                    {resolvedSection && (
                      <p className="country-name-outline truncate text-[11px] font-bold text-white/82">
                        {resolvedSection.title}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className="h-6 shrink-0 rounded-full border border-white/30 bg-black/42 px-2 text-[11px] font-black text-white shadow-none">
                  {statusLabel}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-2xl bg-[linear-gradient(180deg,#16d866,#0fb653)] px-2 text-[12px] font-black text-white shadow-[0_8px_22px_rgba(16,190,88,0.24)] hover:bg-[#14c75d]"
                  onClick={() => void runMark("owned")}
                >
                  <CheckCircle2Icon className="size-4" />
                  Tenho
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-2xl border-white/45 bg-black/24 px-2 text-[12px] font-black text-white hover:bg-white/12 hover:text-white"
                  onClick={() => void runMark("duplicate")}
                >
                  <Repeat2Icon className="size-4" />
                  Repetida
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
