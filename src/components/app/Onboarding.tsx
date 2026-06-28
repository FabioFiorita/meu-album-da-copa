import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
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

const CREATE_ALBUM_TIMEOUT_MS = 15000;

function SoccerBallIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="currentColor" />
      <path
        d="M16 7.5 21 11l-1.9 5.9h-6.2L11 11l5-3.5Zm-8.4 7.1 4.3 3.1-1.5 5.3a11.1 11.1 0 0 1-5.5-7l2.7-1.4Zm16.8 0 2.7 1.4a11.1 11.1 0 0 1-5.5 7l-1.5-5.3 4.3-3.1ZM12.2 25h7.6l1.2 2.6a11.3 11.3 0 0 1-10 0l1.2-2.6ZM9.7 5.9l.5 3.5-4.1 2.9A11.3 11.3 0 0 1 9.7 5.9Zm12.6 0a11.3 11.3 0 0 1 3.6 6.4l-4.1-2.9.5-3.5Z"
        fill="#12C34A"
      />
    </svg>
  );
}

function ClipboardBadgeIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
      <path
        d="M10.5 6.5h11A3.5 3.5 0 0 1 25 10v16.5A3.5 3.5 0 0 1 21.5 30h-11A3.5 3.5 0 0 1 7 26.5V10a3.5 3.5 0 0 1 3.5-3.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 5.5h1.3A3 3 0 0 1 16 4.5a3 3 0 0 1 2.2 1h1.3a2 2 0 0 1 2 2V10h-11V7.5a2 2 0 0 1 2-2Z"
        fill="#222"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 15h7M12.5 20h7M12.5 25h4"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Onboarding({
  enterByFullCode,
  onAlbumCreated,
  onSessionOpened,
}: Props) {
  const createAlbum = useMutation(api.albums.create);
  const [creating, setCreating] = useState(false);
  const [openEnter, setOpenEnter] = useState(false);
  const [pasteValue, setPasteValue] = useState("");

  function withCreateTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        reject(
          new Error(
            "Não foi possível conectar ao servidor. Confira se o backend está acessível neste celular.",
          ),
        );
      }, CREATE_ALBUM_TIMEOUT_MS);

      promise.then(
        (value) => {
          window.clearTimeout(timeoutId);
          resolve(value);
        },
        (error: unknown) => {
          window.clearTimeout(timeoutId);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const r = await withCreateTimeout(createAlbum({ templateId: "wc2026" }));
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
      toast.error("Código completo inválido. Use FIGUS_ALBUM_V1...");
      return;
    }
    setOpenEnter(false);
    setPasteValue("");
    onSessionOpened();
    toast.success("Álbum aberto.");
  }

  return (
    <div className="h-svh overflow-y-auto bg-[var(--app-bg)] text-[var(--app-text)]">
      <div
        className="relative mx-auto flex min-h-svh max-w-[430px] flex-col bg-[var(--app-bg)] bg-no-repeat shadow-2xl"
        style={{
          backgroundImage:
            "image-set(url('/onboarding-copa-2026-background.webp') type('image/webp'), url('/onboarding-copa-2026-background.png') type('image/png'))",
          backgroundPosition: "top center",
          backgroundSize: "cover",
        }}
      >
        <main className="relative z-10 flex flex-1 flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[clamp(7.1rem,17svh,12.5rem)] min-[390px]:px-6">
          <section className="text-center">
            <h1
              className="font-['Arial_Rounded_MT_Bold','Trebuchet_MS',sans-serif] text-[clamp(2rem,4.1svh,2.38rem)] leading-none font-semibold tracking-normal text-[#FFF7E8]"
              style={{
                WebkitTextStroke: "1px #815A21",
                textShadow:
                  "0 2px 0 #9B6825, 0 4px 0 #3D2B19, 0 7px 12px rgba(0,0,0,.7)",
              }}
            >
              Meu álbum da Copa
            </h1>
            <p className="mx-auto mt-3 max-w-[22rem] text-[clamp(0.95rem,2svh,1.12rem)] leading-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,.7)]">
              Guarde o código completo em local seguro.
              <br />
              Sem ele não há recuperação.
            </p>
          </section>

          <section className="mt-[clamp(1.1rem,2.6svh,1.7rem)] rounded-[var(--app-radius-xl)] border-[3px] border-[var(--app-border-strong)] bg-[var(--app-surface-elevated)] px-[clamp(1rem,2.1svh,1.3rem)] py-[clamp(1rem,2.2svh,1.35rem)] text-center shadow-[0_10px_18px_rgba(0,0,0,.42),inset_0_0_42px_rgba(255,255,255,.035)]">
            <h2 className="text-[clamp(1.55rem,3.25svh,1.95rem)] leading-none font-semibold tracking-normal text-[var(--app-text)]">
              Criar álbum novo
            </h2>
            <p className="mx-auto mt-3 max-w-[20.5rem] text-[clamp(0.94rem,1.95svh,1.1rem)] leading-tight text-[var(--app-text)]">
              Gera um código público e uma chave de edição. Quem tiver o código
              completo pode editar o álbum.
            </p>
            <Button
              type="button"
              disabled={creating}
              onClick={() => void handleCreate()}
              className="mt-5 h-[clamp(3rem,5.4svh,3.55rem)] w-full rounded-[var(--app-radius-md)] border-0 bg-[image:var(--app-cta-gradient)] text-[clamp(1.18rem,2.45svh,1.48rem)] font-black text-[var(--app-on-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_8px_16px_rgba(0,0,0,.35)]"
            >
              <SoccerBallIcon />
              {creating ? "Criando..." : "Criar álbum"}
            </Button>
          </section>

          <section className="mt-[clamp(0.85rem,2svh,1.25rem)] rounded-[var(--app-radius-xl)] border-[3px] border-[var(--app-border-strong)] bg-[var(--app-surface-elevated)] px-[clamp(1.05rem,2.5svh,1.55rem)] py-[clamp(1rem,2.15svh,1.35rem)] shadow-[0_10px_18px_rgba(0,0,0,.42),inset_0_0_42px_rgba(255,255,255,.035)]">
            <h2 className="text-[clamp(1.45rem,3svh,1.85rem)] leading-tight font-semibold tracking-normal text-[var(--app-text)]">
              Entrar com código
              <br />
              completo
            </h2>
            <p className="mt-3 text-center text-[clamp(0.9rem,1.82svh,1.03rem)] leading-tight text-[var(--app-text)]">
              Cole o código FIGUS_ALBUM_V1 que você já salvou.
            </p>

            <Dialog open={openEnter} onOpenChange={setOpenEnter}>
              <DialogTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-5 h-[clamp(2.85rem,5.2svh,3.25rem)] w-full rounded-[var(--app-radius-md)] border-[3px] border-[var(--app-border-strong)] bg-[var(--app-surface-elevated)] text-[clamp(0.98rem,2.08svh,1.2rem)] font-black text-[var(--app-gold-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,.08)] hover:bg-[var(--app-surface-gold)] hover:text-[var(--app-gold-accent)]"
                  />
                }
              >
                <ClipboardBadgeIcon />
                Colar código de acesso
              </DialogTrigger>
              <DialogContent className="bg-[var(--app-dialog-bg)] text-[var(--app-dialog-text)] ring-[var(--app-border-strong)]">
                <DialogHeader>
                  <DialogTitle>Código completo</DialogTitle>
                  <DialogDescription className="text-[var(--app-muted-text)]">
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
                        placeholder="FIGUS_ALBUM_V1..."
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
                    <FieldDescription className="text-[var(--app-muted-text)]">
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
          </section>
        </main>
      </div>
    </div>
  );
}
