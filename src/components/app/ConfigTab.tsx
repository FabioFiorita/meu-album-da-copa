import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { AlbumSession } from "@/lib/albumSession";
import { copyText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";

type Props = {
  session: AlbumSession;
  leaveLocal: () => void;
  updateSessionKeys: (code: string, writeKey: string, fullAccessCode: string) => void;
};

export function ConfigTab({ session, leaveLocal, updateSessionKeys }: Props) {
  const snapshot = useQuery(api.albums.getPrivateSnapshot, {
    code: session.code,
    writeKey: session.writeKey,
  });
  const rename = useMutation(api.albums.rename);
  const setCompare = useMutation(api.albums.setCompareEnabled);
  const rotate = useMutation(api.albums.rotateWriteKey);
  const resetAlbum = useMutation(api.albums.resetAlbum);

  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [rotateOpen, setRotateOpen] = useState(false);
  const [newKeysOpen, setNewKeysOpen] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [shareFullOpen, setShareFullOpen] = useState(false);

  const nameValue = nameDraft ?? snapshot?.album.name ?? "";

  async function saveName() {
    try {
      await rename({
        code: session.code,
        writeKey: session.writeKey,
        name: nameValue.trim(),
      });
      setNameDraft(null);
      toast.success("Nome atualizado.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function onCompare(v: boolean) {
    try {
      await setCompare({
        code: session.code,
        writeKey: session.writeKey,
        enabled: v,
      });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function doRotate() {
    try {
      const r = await rotate({
        code: session.code,
        writeKey: session.writeKey,
      });
      updateSessionKeys(r.code, r.writeKey, r.fullAccessCode);
      setRotateOpen(false);
      setNewKeysOpen(r.fullAccessCode);
      toast.success("Chave rotacionada.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function doReset() {
    try {
      await resetAlbum({
        code: session.code,
        writeKey: session.writeKey,
      });
      setResetOpen(false);
      toast.success("Álbum resetado.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-28 pt-2">
      <Card>
        <CardHeader>
          <CardTitle>Identidade</CardTitle>
          <CardDescription>Nome exibido no álbum.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="album-name">Nome</FieldLabel>
              <Input
                id="album-name"
                value={nameValue}
                onChange={(e) => setNameDraft(e.target.value)}
              />
            </Field>
          </FieldGroup>
          <Button type="button" onClick={() => void saveName()}>
            Salvar nome
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Compartilhamento</CardTitle>
          <CardDescription>Códigos e comparação pública.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Comparação pública</span>
              <FieldDescription>
                Permite que outros comparem faltantes com o código público.
              </FieldDescription>
            </div>
            <Switch
              checked={snapshot?.album.compareEnabled ?? false}
              onCheckedChange={(v) => void onCompare(v)}
              disabled={snapshot === undefined}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-sm">{session.code}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  void copyText(session.code)
                    .then(() => toast.success("Código público copiado."))
                    .catch((e) => toast.error(errorMessage(e)))
                }
              >
                Copiar código público
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShareFullOpen(true)}
              >
                Copiar código completo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRotateOpen(true)}
          >
            Rotacionar chave de edição
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Este dispositivo</CardTitle>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => leaveLocal()}>
            Sair deste álbum aqui
          </Button>
        </CardContent>
      </Card>
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Zona de perigo</CardTitle>
          <CardDescription>Apaga todas as figurinhas marcadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive" onClick={() => setResetOpen(true)}>
            Resetar álbum
          </Button>
        </CardContent>
      </Card>
      <AlertDialog open={rotateOpen} onOpenChange={setRotateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotacionar chave?</AlertDialogTitle>
            <AlertDialogDescription>
              O código completo antigo deixa de funcionar. Guarde o novo código
              com segurança.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={() => void doRotate()}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!newKeysOpen} onOpenChange={() => setNewKeysOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Novo código completo</AlertDialogTitle>
            <AlertDialogDescription className="break-all font-mono">
              {newKeysOpen}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() => {
                if (!newKeysOpen) return;
                void copyText(newKeysOpen)
                  .then(() => toast.success("Copiado."))
                  .catch((e) => toast.error(errorMessage(e)));
              }}
            >
              Copiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar todo o álbum?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as figurinhas voltam a faltante. Código e chave permanecem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={() => void doReset()}>
              Resetar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={shareFullOpen} onOpenChange={setShareFullOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Código completo</AlertDialogTitle>
            <AlertDialogDescription>
              Quem tiver este código pode editar seu álbum. Copie só para pessoas
              de confiança.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() =>
                void copyText(session.fullAccessCode)
                  .then(() => {
                    toast.success("Copiado.");
                    setShareFullOpen(false);
                  })
                  .catch((e) => toast.error(errorMessage(e)))
              }
            >
              Copiar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
