import { useMutation, useQuery } from "convex/react";
import { ArrowLeftRightIcon, ClipboardPasteIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AlbumSession } from "@/lib/albumSession";
import { pasteFromClipboard } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";
import { normalizeAlbumCode, parseFullAccessCode } from "@convex/lib/access";
import { WC_2026_TEMPLATE } from "@convex/lib/templates";

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

function sectionTitle(sectionId: string): string {
  return WC_2026_TEMPLATE.sections.find((s) => s.id === sectionId)?.title ?? sectionId;
}

function sectionEmoji(sectionId: string): string {
  return WC_2026_TEMPLATE.sections.find((s) => s.id === sectionId)?.emoji ?? "🏷️";
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
    () => (compare ? [...compare.theyCanGiveMe].sort(sortRows) : []),
    [compare],
  );
  const iCanGive = useMemo<Row[]>(
    () => (compare ? [...compare.iCanGive].sort(sortRows) : []),
    [compare],
  );

  const theyByS = useMemo(() => groupBySection(theyCanGiveMe), [theyCanGiveMe]);
  const meByS = useMemo(() => groupBySection(iCanGive), [iCanGive]);

  if (!otherCode) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-28 pt-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRightIcon className="size-5" />
              Trocar
            </CardTitle>
            <CardDescription>
              Cole o código público do outro álbum para ver o que vocês podem
              trocar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="other-code">Código público</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="other-code"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="ABCD-EFGH-IJ"
                    autoCapitalize="characters"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      onClick={() => void paste()}
                      aria-label="Colar"
                    >
                      <ClipboardPasteIcon />
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>
                  O outro álbum precisa ter a comparação pública ativada.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <Button
              type="button"
              className="mt-4 w-full"
              onClick={submitCode}
            >
              Comparar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (compare === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-28 pt-2">
        <Card>
          <CardHeader>
            <CardTitle>Comparando…</CardTitle>
          </CardHeader>
        </Card>
        <Button type="button" variant="outline" onClick={clear}>
          Trocar de álbum
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 pb-28 pt-2">
      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-base">{compare.otherAlbum.name}</CardTitle>
          <CardDescription className="font-mono text-xs">
            {compare.otherAlbum.code}
          </CardDescription>
          <div className="flex gap-2 pt-1">
            <Badge variant="secondary">
              {compare.otherAlbum.ownedCount} coladas
            </Badge>
            <Badge variant="secondary">
              {compare.otherAlbum.duplicateCount} repetidas
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={clear}
            >
              Trocar de álbum
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="receive">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="receive">
            Eles têm ({theyCanGiveMe.length})
          </TabsTrigger>
          <TabsTrigger value="give">
            Eu tenho ({iCanGive.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="receive" className="flex flex-col gap-2 pt-2">
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
        <TabsContent value="give" className="flex flex-col gap-2 pt-2">
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
    <Card>
      <CardHeader>
        <CardDescription>{text}</CardDescription>
      </CardHeader>
    </Card>
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
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-2">
      <div className="flex items-center gap-2 px-1">
        <span aria-hidden>{sectionEmoji(sectionId)}</span>
        <span className="font-medium">{sectionId}</span>
        <span className="text-xs text-muted-foreground">
          {sectionTitle(sectionId)}
        </span>
        <Badge variant="secondary" className="ml-auto">
          {rows.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-1">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex items-center gap-3 rounded-md border px-3 py-2"
          >
            <span className="w-10 text-base font-semibold tabular-nums">
              #{r.number}
            </span>
            <Badge variant="secondary" className="tabular-nums">
              ×{showQty(r)} {qtyLabel}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="default"
              className="ml-auto"
              onClick={() => onAction(r)}
            >
              {actionLabel === "Recebi" ? <PlusIcon /> : <MinusIcon />}
              {actionLabel}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
