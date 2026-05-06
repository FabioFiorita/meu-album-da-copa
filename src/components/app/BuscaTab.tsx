import { useMutation, useQuery } from "convex/react";
import { ZapIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { AlbumSession } from "@/lib/albumSession";
import { errorMessage } from "@/lib/errors";
import { buildStickerKey } from "@convex/lib/stickerKeys";
import { stickerExists } from "@convex/lib/templates";

type Props = { session: AlbumSession };

export function BuscaTab({ session }: Props) {
  const snapshot = useQuery(api.albums.getPrivateSnapshot, {
    code: session.code,
    writeKey: session.writeKey,
  });
  const markQuick = useMutation(api.stickers.markQuick);
  const [country, setCountry] = useState("");
  const [num, setNum] = useState("");

  const resolved = useMemo(() => {
    const c = country.trim().toUpperCase();
    const n = num.trim();
    if (c.length !== 3 || n.length === 0) return null;
    try {
      const key = buildStickerKey("wc2026", c, n);
      if (!stickerExists("wc2026", key)) return { error: "Figurinha inexistente." };
      return { key, sectionId: c, number: n };
    } catch {
      return { error: "Combinação inválida." };
    }
  }, [country, num]);

  const count =
    resolved && "key" in resolved && snapshot
      ? snapshot.stickers.find((s) => s.key === resolved.key)?.count ?? 0
      : 0;

  async function runMark(mode: "owned" | "duplicate") {
    if (!resolved || !("key" in resolved)) return;
    try {
      await markQuick({
        code: session.code,
        writeKey: session.writeKey,
        sectionId: resolved.sectionId,
        number: resolved.number,
        mode,
      });
      toast.success(mode === "owned" ? "Possuída." : "Repetida ajustada.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const empty =
    country.trim().length === 0 && num.trim().length === 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-28 pt-2">
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <ZapIcon className="text-amber-500" />
          <div className="flex flex-col gap-1">
            <CardTitle>Busca rápida</CardTitle>
            <CardDescription>
              Busque rápido uma figurinha e marque como possuída ou repetida.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
      <Card className="p-4">
        <FieldGroup className="flex flex-row flex-wrap gap-4">
          <Field className="min-w-[10rem] flex-1">
            <FieldLabel>País</FieldLabel>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <Input
                  key={i}
                  maxLength={1}
                  className="size-10 text-center uppercase"
                  value={country[i] ?? ""}
                  onChange={(e) => {
                    const ch = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Za-z]/g, "");
                    const padded = (country + "   ").slice(0, 3).split("");
                    padded[i] = ch.slice(-1) || "";
                    const next = padded.join("").replace(/\s/g, "").slice(0, 3);
                    setCountry(next);
                    if (ch && i < 2) {
                      const el = e.target.parentElement?.children[i + 1] as
                        | HTMLInputElement
                        | undefined;
                      el?.focus();
                    }
                  }}
                />
              ))}
            </div>
          </Field>
          <Field className="min-w-[6rem] flex-1">
            <FieldLabel>Número</FieldLabel>
            <div className="flex gap-1">
              {[0, 1].map((i) => (
                <Input
                  key={i}
                  maxLength={1}
                  inputMode="numeric"
                  className="size-10 text-center"
                  value={num[i] ?? ""}
                  onChange={(e) => {
                    const ch = e.target.value.replace(/\D/g, "");
                    const padded = (num + "  ").slice(0, 2).split("");
                    padded[i] = ch.slice(-1) || "";
                    const next = padded.join("").replace(/\s/g, "").slice(0, 2);
                    setNum(next);
                    if (ch && i < 1) {
                      const el = e.target.parentElement?.children[i + 1] as
                        | HTMLInputElement
                        | undefined;
                      el?.focus();
                    }
                  }}
                />
              ))}
            </div>
          </Field>
        </FieldGroup>
      </Card>
      {empty ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Digite para buscar</EmptyTitle>
            <EmptyDescription>
              Comece a digitar para buscar uma figurinha.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : resolved && "error" in resolved ? (
        <Alert variant="destructive">
          <AlertDescription>{resolved.error}</AlertDescription>
        </Alert>
      ) : resolved && "key" in resolved ? (
        <Card>
          <CardHeader className="flex flex-col gap-3">
            <CardTitle className="text-base font-mono">{resolved.key}</CardTitle>
            <CardDescription>
              No álbum:{" "}
              {count === 0
                ? "faltante"
                : count === 1
                  ? "possuída"
                  : `${count} cópias`}
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void runMark("owned")}
              >
                Marcar possuída
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void runMark("duplicate")}
              >
                Marcar repetida
              </Button>
            </div>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
