import { useMutation, useQuery } from "convex/react";
import {
  CopyIcon,
  KeyRoundIcon,
  LogOutIcon,
  MoonIcon,
  PaletteIcon,
  ShieldCheckIcon,
  SunIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";
import { type ReactNode, useReducer } from "react";
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { AlbumSession } from "@/lib/albumSession";
import type { AppTheme } from "@/lib/appTheme";
import { copyText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

type Props = {
  session: AlbumSession;
  leaveLocal: () => void;
  updateSessionKeys: (
    code: string,
    writeKey: string,
    fullAccessCode: string,
  ) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const themeOptions = [
  { value: "dark", label: "Escuro", Icon: MoonIcon },
  { value: "light", label: "Claro", Icon: SunIcon },
] satisfies Array<{ value: AppTheme; label: string; Icon: LucideIcon }>;

const cardClass =
  "rounded-[1.35rem] border-2 border-[var(--app-border)] bg-[var(--app-card)] p-4 text-[var(--app-text)] shadow-[0_14px_36px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.08)]";

const mutedText = "text-[var(--app-muted-text)]";

const outlineButton =
  "rounded-2xl border-[var(--app-border)] bg-[var(--app-button-muted)] text-[var(--app-gold)] hover:bg-[var(--app-button-muted-hover)] hover:text-[var(--app-gold-strong)]";

type ConfigUiState = {
  nameDraft: string | null;
  rotateOpen: boolean;
  newKeysOpen: string | null;
  resetOpen: boolean;
  shareFullOpen: boolean;
};

const initialConfigUiState: ConfigUiState = {
  nameDraft: null,
  rotateOpen: false,
  newKeysOpen: null,
  resetOpen: false,
  shareFullOpen: false,
};

function configUiReducer(
  state: ConfigUiState,
  patch: Partial<ConfigUiState>,
): ConfigUiState {
  return { ...state, ...patch };
}

export function ConfigTab({
  session,
  leaveLocal,
  updateSessionKeys,
  theme,
  setTheme,
}: Props) {
  const snapshot = useQuery(api.albums.getPrivateSnapshot, {
    code: session.code,
    writeKey: session.writeKey,
  });
  const rename = useMutation(api.albums.rename);
  const setCompare = useMutation(api.albums.setCompareEnabled);
  const rotate = useMutation(api.albums.rotateWriteKey);
  const resetAlbum = useMutation(api.albums.resetAlbum);

  const [uiState, setUiState] = useReducer(
    configUiReducer,
    initialConfigUiState,
  );
  const { nameDraft, rotateOpen, newKeysOpen, resetOpen, shareFullOpen } =
    uiState;

  const nameValue = nameDraft ?? snapshot?.album.name ?? "";

  async function saveName() {
    try {
      await rename({
        code: session.code,
        writeKey: session.writeKey,
        name: nameValue.trim(),
      });
      setUiState({ nameDraft: null });
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
      setUiState({ rotateOpen: false, newKeysOpen: r.fullAccessCode });
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
      setUiState({ resetOpen: false });
      toast.success("Álbum resetado.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4 pb-4 pt-4">
      <section className={cardClass}>
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-gold)]">
            <PaletteIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-semibold leading-tight tracking-normal">
              Aparência
            </h1>
            <p className={cn("mt-1 text-[12px] font-semibold", mutedText)}>
              Escolha como o álbum aparece neste aparelho.
            </p>
          </div>
        </div>

        <div className="mt-3 inline-grid w-fit grid-cols-2 gap-1 rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-segment-bg)] p-1">
          {themeOptions.map(({ value, label, Icon }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex h-9 min-w-[6.5rem] items-center justify-center gap-1.5 rounded-xl border px-3 text-[12px] font-black transition-colors",
                  selected
                    ? "border-[var(--app-nav-active-border)] bg-[var(--app-nav-active)] text-[var(--app-nav-active-text)]"
                    : "border-transparent text-[var(--app-muted-text)] hover:bg-[var(--app-button-muted)] hover:text-[var(--app-text)]",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader
          title="Identidade"
          description="Nome exibido no álbum."
        />
        <div className="mt-4 flex flex-col gap-3">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="album-name">Nome</FieldLabel>
              <Input
                id="album-name"
                value={nameValue}
                onChange={(e) => setUiState({ nameDraft: e.target.value })}
                className="h-11 rounded-2xl border-[var(--app-border)] bg-[var(--app-field-bg)] text-[var(--app-text)] placeholder:text-[var(--app-muted-text)]"
              />
            </Field>
          </FieldGroup>
          <Button
            type="button"
            variant="outline"
            onClick={() => void saveName()}
            className={cn("h-11 w-full text-sm font-black", outlineButton)}
          >
            Salvar nome
          </Button>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader
          title="Compartilhamento"
          description="Códigos e comparação pública."
          Icon={ShieldCheckIcon}
        />
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-field-bg)] p-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-black">Comparação pública</span>
              <FieldDescription className={mutedText}>
                Permite comparar faltantes com o código público.
              </FieldDescription>
            </div>
            <Switch
              checked={snapshot?.album.compareEnabled ?? false}
              onCheckedChange={(v) => void onCompare(v)}
              disabled={snapshot === undefined}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-field-bg)] p-3">
            <p className="break-all font-mono text-[12px] font-bold text-[var(--app-text)]">
              {session.code}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={outlineButton}
                onClick={() =>
                  void copyText(session.code)
                    .then(() => toast.success("Código público copiado."))
                    .catch((e) => toast.error(errorMessage(e)))
                }
              >
                <CopyIcon className="size-4" />
                Público
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={outlineButton}
                onClick={() => setUiState({ shareFullOpen: true })}
              >
                <CopyIcon className="size-4" />
                Completo
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader title="Segurança" Icon={KeyRoundIcon} />
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            className={outlineButton}
            onClick={() => setUiState({ rotateOpen: true })}
          >
            <KeyRoundIcon className="size-4" />
            Rotacionar chave de edição
          </Button>
        </div>
      </section>

      <section className={cardClass}>
        <SectionHeader title="Este dispositivo" Icon={LogOutIcon} />
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            className={outlineButton}
            onClick={() => leaveLocal()}
          >
            <LogOutIcon className="size-4" />
            Sair deste álbum aqui
          </Button>
        </div>
      </section>

      <section className="rounded-[1.35rem] border-2 border-red-500/45 bg-[var(--app-danger-card)] p-4 text-[var(--app-text)] shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
        <SectionHeader
          title="Zona de perigo"
          description="Apaga todas as figurinhas marcadas."
          Icon={Trash2Icon}
        />
        <div className="mt-4">
          <Button
            type="button"
            variant="destructive"
            className="rounded-2xl font-black"
            onClick={() => setUiState({ resetOpen: true })}
          >
            <Trash2Icon className="size-4" />
            Resetar álbum
          </Button>
        </div>
      </section>

      <ConfirmDialogs
        rotateOpen={rotateOpen}
        setRotateOpen={(rotateOpen) => setUiState({ rotateOpen })}
        doRotate={doRotate}
        newKeysOpen={newKeysOpen}
        setNewKeysOpen={(newKeysOpen) => setUiState({ newKeysOpen })}
        resetOpen={resetOpen}
        setResetOpen={(resetOpen) => setUiState({ resetOpen })}
        doReset={doReset}
        shareFullOpen={shareFullOpen}
        setShareFullOpen={(shareFullOpen) => setUiState({ shareFullOpen })}
        fullAccessCode={session.fullAccessCode}
      />
    </div>
  );
}

function SectionHeader({
  title,
  description,
  Icon,
}: {
  title: string;
  description?: string;
  Icon?: LucideIcon;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-gold)]">
          <Icon className="size-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-[16px] font-semibold leading-tight tracking-normal">
          {title}
        </h2>
        {description && (
          <p className={cn("mt-1 text-[12px] font-semibold", mutedText)}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function ConfirmDialogs({
  rotateOpen,
  setRotateOpen,
  doRotate,
  newKeysOpen,
  setNewKeysOpen,
  resetOpen,
  setResetOpen,
  doReset,
  shareFullOpen,
  setShareFullOpen,
  fullAccessCode,
}: {
  rotateOpen: boolean;
  setRotateOpen: (open: boolean) => void;
  doRotate: () => Promise<void>;
  newKeysOpen: string | null;
  setNewKeysOpen: (code: string | null) => void;
  resetOpen: boolean;
  setResetOpen: (open: boolean) => void;
  doReset: () => Promise<void>;
  shareFullOpen: boolean;
  setShareFullOpen: (open: boolean) => void;
  fullAccessCode: string;
}) {
  return (
    <>
      <AlertDialog open={rotateOpen} onOpenChange={setRotateOpen}>
        <ThemedAlertContent>
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
        </ThemedAlertContent>
      </AlertDialog>

      <AlertDialog
        open={!!newKeysOpen}
        onOpenChange={() => setNewKeysOpen(null)}
      >
        <ThemedAlertContent>
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
        </ThemedAlertContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <ThemedAlertContent>
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
        </ThemedAlertContent>
      </AlertDialog>

      <AlertDialog open={shareFullOpen} onOpenChange={setShareFullOpen}>
        <ThemedAlertContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Código completo</AlertDialogTitle>
            <AlertDialogDescription>
              Quem tiver este código pode editar seu álbum. Copie só para
              pessoas de confiança.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() =>
                void copyText(fullAccessCode)
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
        </ThemedAlertContent>
      </AlertDialog>
    </>
  );
}

function ThemedAlertContent({ children }: { children: ReactNode }) {
  return (
    <AlertDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto border-[var(--app-border)] bg-[var(--app-dialog-bg)] text-[var(--app-dialog-text)] ring-[var(--app-border)]">
      {children}
    </AlertDialogContent>
  );
}
