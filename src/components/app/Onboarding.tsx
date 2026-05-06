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
      <path d="M12.5 15h7M12.5 20h7M12.5 25h4" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
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
      toast.error("Código completo inválido. Use FIGUS_ALBUM_V1...");
      return;
    }
    setOpenEnter(false);
    setPasteValue("");
    onSessionOpened();
    toast.success("Álbum aberto.");
  }

  return (
    <div className="h-dvh overflow-hidden bg-black text-white">
      <div
        className="relative mx-auto flex h-dvh max-w-[430px] flex-col overflow-hidden bg-[#141414] bg-no-repeat shadow-2xl"
        style={{
          backgroundImage: "url('/onboarding-copa-2026-background.png')",
          backgroundPosition: "top center",
          backgroundSize: "100% 100%",
        }}
      >
        <main className="relative z-10 flex flex-1 flex-col px-6 pb-4 pt-[clamp(8.4rem,19.7dvh,16rem)]">
          <section className="text-center">
            <h1
              className="font-['Arial_Rounded_MT_Bold','Trebuchet_MS',sans-serif] text-[clamp(2.18rem,4.35dvh,2.42rem)] leading-none font-black tracking-normal text-[#FFF7E8]"
              style={{
                WebkitTextStroke: "1px #815A21",
                textShadow:
                  "0 2px 0 #9B6825, 0 4px 0 #3D2B19, 0 7px 12px rgba(0,0,0,.7)",
              }}
            >
              Meu álbum da Copa
            </h1>
            <p className="mx-auto mt-4 max-w-[22rem] text-[clamp(1rem,2.15dvh,1.15rem)] leading-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,.7)]">
              Guarde o código completo em local seguro.
              <br />
              Sem ele não há recuperação.
            </p>
          </section>

          <section className="mt-[clamp(1.4rem,3.4dvh,2.1rem)] rounded-[1.25rem] border-[3px] border-[#D5B15E] bg-[#272727]/94 px-[clamp(1.05rem,2.35dvh,1.35rem)] py-[clamp(1.15rem,2.6dvh,1.5rem)] text-center shadow-[0_10px_18px_rgba(0,0,0,.42),inset_0_0_42px_rgba(255,255,255,.035)]">
            <h2 className="text-[clamp(1.75rem,3.6dvh,2rem)] leading-none font-black tracking-normal text-white drop-shadow-[0_2px_2px_rgba(0,0,0,.7)]">
              Criar álbum novo
            </h2>
            <p className="mx-auto mt-4 max-w-[20.5rem] text-[clamp(1rem,2.2dvh,1.18rem)] leading-tight text-white">
              Gera um código público e uma chave de edição. Quem tiver o código
              completo pode editar o álbum.
            </p>
            <Button
              type="button"
              disabled={creating}
              onClick={() => void handleCreate()}
              className="mt-6 h-[clamp(3.25rem,6.1dvh,3.65rem)] w-full rounded-[0.95rem] border-0 bg-gradient-to-b from-[#13D84D] to-[#06A836] text-[clamp(1.35rem,2.7dvh,1.55rem)] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,.25),0_8px_16px_rgba(0,0,0,.35)] hover:from-[#13D84D] hover:to-[#06A836]"
            >
              <SoccerBallIcon />
              {creating ? "Criando..." : "Criar álbum"}
            </Button>
          </section>

          <section className="mt-[clamp(1rem,2.45dvh,1.45rem)] rounded-[1.25rem] border-[3px] border-[#D5B15E] bg-[#272727]/94 px-[clamp(1.25rem,3dvh,1.65rem)] py-[clamp(1.15rem,2.45dvh,1.45rem)] shadow-[0_10px_18px_rgba(0,0,0,.42),inset_0_0_42px_rgba(255,255,255,.035)]">
            <h2 className="text-[clamp(1.68rem,3.35dvh,1.9rem)] leading-tight font-black tracking-normal text-white drop-shadow-[0_2px_2px_rgba(0,0,0,.7)]">
              Entrar com código
              <br />
              completo
            </h2>
            <p className="mt-4 text-center text-[clamp(0.96rem,2dvh,1.06rem)] leading-tight text-white">
              Cole o código FIGUS_ALBUM_V1 que você já salvou.
            </p>

            <Dialog open={openEnter} onOpenChange={setOpenEnter}>
              <DialogTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6 h-[clamp(3rem,5.7dvh,3.35rem)] w-full rounded-[0.95rem] border-[3px] border-[#D5B15E] bg-[#2A2A2A] text-[clamp(1.05rem,2.35dvh,1.28rem)] font-black text-[#D5B15E] shadow-[inset_0_1px_0_rgba(255,255,255,.08)] hover:bg-[#303030] hover:text-[#D5B15E]"
                  />
                }
              >
                <ClipboardBadgeIcon />
                Colar código de acesso
              </DialogTrigger>
              <DialogContent className="bg-[#1F1F1F] text-white ring-[#D5B15E]/70">
                <DialogHeader>
                  <DialogTitle>Código completo</DialogTitle>
                  <DialogDescription className="text-white/70">
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
                    <FieldDescription className="text-white/60">
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
