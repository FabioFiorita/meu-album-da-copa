import {
  CheckCircle2Icon,
  Repeat2Icon,
  SearchIcon,
  ZapIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { StickerSlot, TabHeaderCard } from "@/components/album";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAlbumSnapshot } from "@/hooks/useAlbumSnapshot";
import { useStickerActions } from "@/hooks/useStickerActions";
import type { AlbumSession } from "@/lib/albumSession";
import { errorMessage } from "@/lib/errors";
import { buildStickerKey } from "@convex/lib/stickerKeys";
import { stickerExists, WC_2026_TEMPLATE } from "@convex/lib/templates";
import { TeamBackgroundForms } from "./TeamBackgroundForms";
import { getTeamTheme, SectionIcon, sectionStyle } from "./teamVisuals";

type Props = { session: AlbumSession };

const COUNTRY_INPUTS = [
  { index: 0, id: "country-letter-1" },
  { index: 1, id: "country-letter-2" },
  { index: 2, id: "country-letter-3" },
] as const;
const NUMBER_INPUTS = [
  { index: 0, id: "sticker-number-1" },
  { index: 1, id: "sticker-number-2" },
] as const;
const inputCellClass =
  "quick-code-input h-14 min-w-0 rounded-[var(--app-radius-md)] border-2 border-[var(--app-border-strong)] bg-[var(--app-field-bg)] text-center text-xl font-black uppercase leading-none text-[var(--app-text)] shadow-[var(--app-shadow-sm)] outline-none transition-colors placeholder:text-[var(--app-muted-text)] focus:border-[var(--app-gold-accent)] focus:bg-[var(--app-surface-elevated)] focus:ring-2 focus:ring-[var(--app-border)]";

export function BuscaTab({ session }: Props) {
  const { snapshot } = useAlbumSnapshot();
  const { markQuick } = useStickerActions(session);
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
  const statusLabel = !snapshot
    ? "Sincronizando..."
    : count === 0
      ? "Faltante"
      : count === 1
        ? "Possuída"
        : `${count} cópias`;
  const previewHeadingClass = previewSection
    ? "country-name-outline text-lg font-semibold leading-tight text-[var(--team-ink)]"
    : "text-lg font-semibold leading-tight text-[var(--app-text)]";
  const previewSubtitleClass = previewSection
    ? "country-name-outline mt-2 text-sm font-semibold leading-relaxed text-[var(--team-ink)]"
    : "mt-2 text-sm font-semibold leading-relaxed text-[var(--app-muted-text)]";

  async function runMark(mode: "owned" | "duplicate") {
    if (!resolved || !resolved.key) return;
    try {
      await markQuick(resolved.sectionId, resolved.number, mode);
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
      <TabHeaderCard
        icon={SearchIcon}
        title="Busca+"
        subtitle="Ache a figurinha pelo código e atualize o álbum em um toque."
        action={
          <Badge className="h-6 rounded-full border border-[var(--app-border)] bg-[var(--app-field-bg)] px-2 text-2xs font-black uppercase tracking-normal text-[var(--app-gold-accent)] shadow-none">
            Rápida
          </Badge>
        }
      />

      <section className="relative overflow-hidden rounded-[var(--app-radius-xl)] border-2 border-[var(--app-border-strong)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-lg)]">
        <div className="absolute inset-x-6 top-5 h-16 rounded-full bg-[color-mix(in_srgb,var(--app-gold)_8%,transparent)] blur-xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-gold)] text-[var(--app-gold-accent)]">
              <ZapIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-none text-[var(--app-text)]">
                Código da figurinha
              </h2>
              <p className="mt-1 text-xs font-bold leading-none text-[var(--app-muted-text)]">
                País + número
              </p>
            </div>
          </div>
        </div>

        <div className="quick-code-panel relative mt-5 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] bg-[var(--app-field-bg)] p-3 shadow-[var(--app-shadow-sm)]">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <fieldset className="min-w-0">
              <legend className="pl-1 text-xs font-black uppercase leading-none tracking-normal text-[var(--app-muted-text)]">
                País
              </legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {COUNTRY_INPUTS.map(({ index: i, id }) => (
                  <input
                    key={id}
                    id={id}
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
            </fieldset>

            <fieldset className="w-[7.25rem]">
              <legend className="pl-1 text-xs font-black uppercase leading-none tracking-normal text-[var(--app-muted-text)]">
                Número
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {NUMBER_INPUTS.map(({ index: i, id }) => (
                  <input
                    key={id}
                    id={id}
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
            </fieldset>
          </div>
        </div>
      </section>

      {!resolved?.key ? (
        <>
          <section
            style={previewSection ? sectionStyle(previewTheme) : undefined}
            className={
              previewSection
                ? "team-card relative overflow-hidden rounded-[var(--app-radius-xl)] border-2 p-5 shadow-[var(--app-shadow-lg)]"
                : "relative overflow-hidden rounded-[var(--app-radius-xl)] border-2 border-[var(--app-border-strong)] bg-[var(--app-surface)] p-5 shadow-[var(--app-shadow-lg)]"
            }
          >
            {previewSection ? (
              <>
                <TeamBackgroundForms />
                <div className="absolute inset-0 z-[1] bg-[var(--app-scrim)]" />
              </>
            ) : (
              <div className="absolute -right-12 top-4 size-36 rounded-full bg-[color-mix(in_srgb,var(--app-gold)_9%,transparent)] blur-2xl" />
            )}
            <div className="relative z-10 grid grid-cols-[4.8rem_1fr] items-center gap-4">
              {previewSection ? (
                <StickerSlot
                  sectionId={previewSection.id}
                  number={previewNumber}
                  theme={previewTheme}
                  owned={false}
                  missing={false}
                  ariaLabel={`Prévia da figurinha ${previewSection.id} ${previewNumber}`}
                />
              ) : (
                <div className="sticker-slot-lite relative flex aspect-[3/4] w-full overflow-hidden rounded-xl border-2 border-[var(--app-border-strong)] bg-[var(--app-surface-gold)] text-xs font-black leading-none tracking-normal shadow-[var(--app-shadow-sm)]">
                  <span
                    aria-hidden="true"
                    className="sticker-slot-label text-black"
                  >
                    <span>{previewCountry}</span>
                    <span>{previewNumber}</span>
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <h2 className={previewHeadingClass}>Digite para buscar</h2>
                <p className={previewSubtitleClass}>
                  Use o código da figurinha para ver o status e marcar.
                </p>
              </div>
            </div>
          </section>
          {errorMessageText && (
            <p
              role="alert"
              className="-mt-2 px-4 text-xs font-black leading-tight tracking-normal text-[var(--destructive)]"
            >
              {errorMessageText}
            </p>
          )}
        </>
      ) : resolved && resolved.key ? (
        <section
          style={sectionStyle(resolvedTheme)}
          className="team-card relative overflow-hidden rounded-[var(--app-radius-xl)] border-2 p-5 shadow-[var(--app-shadow-lg)]"
        >
          <TeamBackgroundForms />

          <div className="relative z-10 grid grid-cols-[4.8rem_1fr] items-center gap-4">
            <StickerSlot
              sectionId={resolved.sectionId}
              number={resolved.number}
              theme={resolvedTheme}
              owned={count > 0}
              duplicateCount={Math.max(0, count - 1)}
              ariaLabel={`${resolved.key} — ${statusLabel}`}
            />

            <div className="min-w-0">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/45 bg-white shadow-[var(--app-shadow-sm)]">
                    {resolvedSection ? (
                      <SectionIcon section={resolvedSection} />
                    ) : (
                      <span className="text-2xs font-black leading-none text-black">
                        {resolved.sectionId.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="country-name-outline truncate text-lg font-semibold leading-tight text-[var(--team-ink)]">
                      {resolved.key}
                    </h2>
                    {resolvedSection && (
                      <p className="country-name-outline truncate text-xs font-bold text-[var(--team-ink)]">
                        {resolvedSection.title}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className="h-6 shrink-0 rounded-full border border-white/30 bg-[var(--app-scrim)] px-2 text-xs font-black text-white shadow-none">
                  {statusLabel}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-[var(--app-radius-md)] bg-[var(--app-cta-gradient)] px-2 text-xs font-black text-[var(--app-on-accent)] shadow-[var(--app-shadow-cta)] hover:bg-[var(--app-success-strong)]"
                  onClick={() => void runMark("owned")}
                >
                  <CheckCircle2Icon className="size-4" />
                  Tenho
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-[var(--app-radius-md)] border-white/45 bg-[var(--app-scrim)] px-2 text-xs font-black text-white hover:bg-white/12 hover:text-white"
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
