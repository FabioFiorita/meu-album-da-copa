import { useMutation, useQuery } from "convex/react";
import { CopyIcon, MinusIcon, PlusIcon, Share2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { AlbumSession } from "@/lib/albumSession";
import { copyText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";
import { encodeDuplicatesPayloadV1 } from "@/lib/sharePayloads";
import { normalizeAlbumCode } from "@convex/lib/access";
import { WC_2026_TEMPLATE } from "@convex/lib/templates";

type Props = { session: AlbumSession };

type DupRow = {
  key: string;
  sectionId: string;
  number: string;
  count: number;
};

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-28 pt-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold">Repetidas</h2>
          <p className="text-sm text-muted-foreground">Total: {totalDupes}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void copyAllAsText()}
            disabled={dupBySection.size === 0}
          >
            <CopyIcon />
            Copiar tudo
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="Compartilhar"
                />
              }
            >
              <Share2Icon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => void sharePublic()}>
                Código público (comparação)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportEncodedDupes()}>
                Payload FIGUS_DUPLICATES
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="search-dup">Buscar países</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <span className="text-muted-foreground">🔎</span>
            </InputGroupAddon>
            <InputGroupInput
              id="search-dup"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar países…"
            />
          </InputGroup>
        </Field>
      </FieldGroup>
      {!snapshot ? (
        <Card>
          <CardHeader>
            <CardTitle>Carregando…</CardTitle>
          </CardHeader>
        </Card>
      ) : sections.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma repetida</CardTitle>
            <CardDescription>
              Quando tiver figurinhas sobrando, elas aparecem aqui.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Accordion multiple className="flex flex-col gap-2">
          {sections.map((sec) => {
            const rows = dupBySection.get(sec.id) ?? [];
            const totalExtras = rows.reduce((s, r) => s + (r.count - 1), 0);
            const summary = rows.map((r) => r.number).join(", ");
            return (
              <AccordionItem
                key={sec.id}
                value={sec.id}
                className="border rounded-lg px-2"
              >
                <AccordionTrigger className="text-sm hover:no-underline">
                  <span className="flex flex-1 flex-col gap-0.5 text-left">
                    <span className="flex items-center gap-2">
                      <span aria-hidden>{sec.emoji ?? "🏷️"}</span>
                      <span className="font-medium">{sec.id}</span>
                      <span className="text-muted-foreground">
                        {sec.title}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {totalExtras}
                      </Badge>
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {summary}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-1 pb-2">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          void copySection(sec.id);
                        }}
                      >
                        <CopyIcon />
                        Copiar {sec.id}
                      </Button>
                    </div>
                    {rows.map((r) => (
                      <div
                        key={r.key}
                        className="flex items-center gap-3 rounded-md border px-3 py-2"
                      >
                        <span className="w-10 text-base font-semibold tabular-nums">
                          #{r.number}
                        </span>
                        <Badge variant="secondary" className="tabular-nums">
                          ×{r.count - 1}
                        </Badge>
                        <div className="ml-auto flex gap-2">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            className="size-9 rounded-full"
                            aria-label="Menos uma repetida"
                            onClick={() => void onDelta(r.key, -1)}
                          >
                            <MinusIcon />
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="default"
                            className="size-9 rounded-full"
                            aria-label="Mais uma repetida"
                            onClick={() => void onDelta(r.key, 1)}
                          >
                            <PlusIcon />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
