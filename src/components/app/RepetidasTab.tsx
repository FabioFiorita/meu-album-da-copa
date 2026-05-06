import { useMutation, useQuery } from "convex/react";
import { ListFilterIcon, MinusIcon, PlusIcon, Share2Icon, UploadIcon } from "lucide-react";
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
import {
  buildMissingExport,
  encodeDuplicatesPayloadV1,
} from "@/lib/sharePayloads";
import { normalizeAlbumCode } from "@convex/lib/access";
import { WC_2026_TEMPLATE } from "@convex/lib/templates";
import { ImportarFaltantesDialog } from "./ImportarFaltantesDialog";

type Props = { session: AlbumSession };

export function RepetidasTab({ session }: Props) {
  const snapshot = useQuery(api.albums.getPrivateSnapshot, {
    code: session.code,
    writeKey: session.writeKey,
  });
  const addCopies = useMutation(api.stickers.addCopies);
  const [q, setQ] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const dupRows = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.stickers.filter((s) => s.count >= 2);
  }, [snapshot]);

  const dupBySection = useMemo(() => {
    const m = new Map<string, typeof dupRows>();
    for (const r of dupRows) {
      const arr = m.get(r.sectionId) ?? [];
      arr.push(r);
      m.set(r.sectionId, arr);
    }
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

  const totalDupes =
    snapshot?.album.duplicateCount ?? 0;

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

  async function exportDupes() {
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
    await copyText(payload);
    toast.success("Lista de repetidas copiada.");
  }

  async function sharePublic() {
    await copyText(normalizeAlbumCode(session.code));
    toast.success("Código público copiado.");
  }

  async function shareFull() {
    await copyText(session.fullAccessCode);
    toast.success("Código completo copiado. Trate como segredo.");
  }

  function exportMissingForCompare() {
    if (!snapshot) return;
    const missingKeys: string[] = [];
    for (const sec of WC_2026_TEMPLATE.sections) {
      for (const st of sec.stickers) {
        const c =
          snapshot.stickers.find((x) => x.key === st.key)?.count ?? 0;
        if (c < 1) missingKeys.push(st.key);
      }
    }
    const payload = buildMissingExport({
      templateId: "wc2026",
      albumCode: session.code,
      missingKeys,
    });
    void copyText(payload).then(() =>
      toast.success("Faltantes copiados para compartilhar."),
    );
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
            size="icon-sm"
            variant="outline"
            aria-label="Exportar"
            onClick={() => void exportDupes()}
          >
            <UploadIcon />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Compartilhar"
              >
                <Share2Icon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => void sharePublic()}>
                Código público (comparação)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void shareFull()}>
                Código completo (edição)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportMissingForCompare()}>
                Copiar faltantes (FIGUS_MISSING)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label="Importar faltantes"
            onClick={() => setImportOpen(true)}
          >
            <ListFilterIcon />
          </Button>
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
      <Accordion type="multiple" className="flex flex-col gap-2">
        {sections.map((sec) => {
          const rows = dupBySection.get(sec.id) ?? [];
          return (
            <AccordionItem
              key={sec.id}
              value={sec.id}
              className="border rounded-lg px-2"
            >
              <AccordionTrigger className="text-sm hover:no-underline">
                <span className="flex flex-1 items-center gap-2">
                  <span aria-hidden>{sec.emoji ?? "🏷️"}</span>
                  <span className="font-medium">{sec.id}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {rows.reduce((s, r) => s + (r.count - 1), 0)}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {rows.map((r) => (
                    <div
                      key={r.key}
                      className="flex w-20 shrink-0 flex-col items-center gap-2 rounded-lg border-2 p-2"
                    >
                      <span className="text-lg font-semibold tabular-nums">
                        {r.number}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="secondary"
                          className="size-7 rounded-full"
                          aria-label="Menos uma repetida"
                          onClick={() => void onDelta(r.key, -1)}
                        >
                          <MinusIcon />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="secondary"
                          className="size-7 rounded-full"
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
      <ImportarFaltantesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        session={session}
      />
    </div>
  );
}
