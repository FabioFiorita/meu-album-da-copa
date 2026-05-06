import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  InputGroupInput,
} from "@/components/ui/input-group";
import { saveSession } from "@/lib/albumSession";
import { pasteFromClipboard } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";

type Props = {
  enterByFullCode: (input: string) => boolean;
  onAlbumCreated: (fullAccessCode: string) => void;
  onSessionOpened: () => void;
};

export function Onboarding({
  enterByFullCode,
  onAlbumCreated,
  onSessionOpened,
}: Props) {
  const createAlbum = useMutation(api.albums.create);
  const [creating, setCreating] = useState(false);
  const [openEnter, setOpenEnter] = useState(false);
  const [pasteValue, setPasteValue] = useState("");

  async function handleCreate() {
    setCreating(true);
    try {
      const r = await createAlbum({ templateId: "wc2026" });
      saveSession({
        templateId: "wc2026",
        code: r.code,
        writeKey: r.writeKey,
        fullAccessCode: r.fullAccessCode,
      });
      onAlbumCreated(r.fullAccessCode);
      toast.success("Álbum criado.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setCreating(false);
    }
  }

  function handleEnterSave() {
    const ok = enterByFullCode(pasteValue.trim());
    if (!ok) {
      toast.error("Código completo inválido. Use FIGUS_ALBUM_V1.…");
      return;
    }
    setOpenEnter(false);
    setPasteValue("");
    onSessionOpened();
    toast.success("Álbum aberto.");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 pb-8 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Meu álbum da Copa</h1>
        <p className="text-sm text-muted-foreground">
          Guarde o código completo em local seguro. Sem ele não há recuperação.
        </p>
      </div>
      <FieldGroup>
        <Card>
          <CardHeader>
            <CardTitle>Criar álbum novo</CardTitle>
            <CardDescription>
              Gera um código público e uma chave de edição. Quem tiver o código
              completo pode editar o álbum.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="w-full"
              disabled={creating}
              onClick={() => void handleCreate()}
            >
              {creating ? "Criando…" : "Criar álbum"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Entrar com código completo</CardTitle>
            <CardDescription>
              Cole o código FIGUS_ALBUM_V1 que você já salvou.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={openEnter} onOpenChange={setOpenEnter}>
              <DialogTrigger
                render={
                  <Button type="button" variant="outline" className="w-full" />
                }
              >
                Colar código de acesso
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Código completo</DialogTitle>
                  <DialogDescription>
                    FIGUS_ALBUM_V1 seguido do código e da chave.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="full-code">Texto</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="full-code"
                        value={pasteValue}
                        onChange={(e) => setPasteValue(e.target.value)}
                        placeholder="FIGUS_ALBUM_V1.…"
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          type="button"
                          onClick={() =>
                            void pasteFromClipboard()
                              .then(setPasteValue)
                              .catch((e) => toast.error(errorMessage(e)))
                          }
                        >
                          Colar
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      Cole da área de transferência se preferir.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="button" onClick={() => handleEnterSave()}>
                    Abrir álbum
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </FieldGroup>
    </div>
  );
}
