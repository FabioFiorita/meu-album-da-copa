import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AlbumSession } from "@/lib/albumSession";
import { pasteFromClipboard } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";
import { isMissingPayloadRaw } from "@/lib/sharePayloads";
import { parseFullAccessCode, normalizeAlbumCode } from "@convex/lib/access";
import { InfoIcon } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  session: AlbumSession;
};

type SearchParams =
  | { mode: "missing"; payload: string }
  | { mode: "album"; otherCode: string };

export function ImportarFaltantesDialog({
  open,
  onOpenChange,
  session,
}: Props) {
  const [text, setText] = useState("");
  const [params, setParams] = useState<SearchParams | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const missingQ = useQuery(
    api.compare.compareWithMissingPayload,
    params?.mode === "missing"
      ? {
          myCode: session.code,
          myWriteKey: session.writeKey,
          payload: params.payload,
        }
      : "skip",
  );
  const albumQ = useQuery(
    api.compare.compareWithAlbum,
    params?.mode === "album"
      ? {
          myCode: session.code,
          myWriteKey: session.writeKey,
          otherCode: params.otherCode,
        }
      : "skip",
  );

  const createTrade = useMutation(api.trades.createTradeOffer);

  async function handleBuscar() {
    const t = text.trim();
    if (!t) {
      toast.error("Cole um texto ou código.");
      return;
    }
    try {
      if (isMissingPayloadRaw(t)) {
        setParams({ mode: "missing", payload: t });
      } else {
        const full = parseFullAccessCode(t);
        const code = full
          ? full.code
          : normalizeAlbumCode(t);
        if (!code || code.length < 8) {
          toast.error("Código público inválido.");
          return;
        }
        setParams({ mode: "album", otherCode: code });
      }
      setSheetOpen(true);
    } catch {
      toast.error("Entrada inválida.");
    }
  }

  async function proposeTrade() {
    if (params?.mode !== "album" || albumQ === undefined || albumQ === null) {
      return;
    }
    const fromGives =
      albumQ.balancedSuggestion.fromMe.length > 0
        ? albumQ.balancedSuggestion.fromMe
        : albumQ.iCanGive.map((x) => x.key);
    const toGives = albumQ.balancedSuggestion.fromOther;
    if (fromGives.length === 0 && toGives.length === 0) {
      toast.error("Nada para propor na sugestão equilibrada.");
      return;
    }
    try {
      await createTrade({
        fromCode: session.code,
        fromWriteKey: session.writeKey,
        toCode: albumQ.otherAlbum.code,
        fromGives,
        toGives,
      });
      toast.success("Proposta de troca enviada.");
      setSheetOpen(false);
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const loadingCompare =
    params &&
    ((params.mode === "missing" && missingQ === undefined) ||
      (params.mode === "album" && albumQ === undefined));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Importar Faltantes</DialogTitle>
          </DialogHeader>
          <Alert>
            <InfoIcon />
            <AlertTitle>Listas do app</AlertTitle>
            <AlertDescription>
              Veja quais repetidas você tem que outro usuário precisa. A lista
              FIGUS_MISSING_V1 deve ser gerada por este app.
            </AlertDescription>
          </Alert>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="import-text">Conteúdo</FieldLabel>
              <InputGroup className="h-auto min-h-32" data-align="block-end">
                <InputGroupTextarea
                  id="import-text"
                  placeholder="Cole aqui…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-28"
                />
                <InputGroupAddon align="block-end">
                  <InputGroupButton
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      void pasteFromClipboard().then(setText)
                    }
                  >
                    Colar da área de transferência
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>
                Payload FIGUS_MISSING_V1, código público ou código completo
                (só o código é usado).
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter className="flex flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleBuscar()}>
              Buscar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="flex max-h-[85dvh] flex-col gap-4 overflow-auto">
          <SheetHeader>
            <SheetTitle>Resultado</SheetTitle>
          </SheetHeader>
          {loadingCompare ? (
            <p className="text-sm text-muted-foreground">Calculando…</p>
          ) : params?.mode === "missing" && missingQ ? (
            <ul className="flex flex-col gap-2 text-sm">
              {missingQ.iCanGive.length === 0 ? (
                <li>Nenhuma figurinha sua serve para essa lista.</li>
              ) : (
                missingQ.iCanGive.map((r) => (
                  <li key={r.key}>
                    {r.sectionId}:{r.number} — você tem{" "}
                    {r.myDuplicateQuantity} repetida(s)
                  </li>
                ))
              )}
            </ul>
          ) : params?.mode === "album" && albumQ ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Álbum {albumQ.otherAlbum.name} — você pode dar{" "}
                {albumQ.iCanGive.length} figurinha(s).
              </p>
              <ul className="flex max-h-40 flex-col gap-1 overflow-auto text-sm">
                {albumQ.iCanGive.map((r) => (
                  <li key={r.key}>
                    {r.key} (repetidas: {r.myDuplicateQuantity})
                  </li>
                ))}
              </ul>
              <Button type="button" onClick={() => void proposeTrade()}>
                Criar proposta de troca (sugestão equilibrada)
              </Button>
            </div>
          ) : (
            <p className="text-sm text-destructive">
              Não foi possível comparar. Verifique se o álbum permite comparação
              pública e o código.
            </p>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
