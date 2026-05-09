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
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAlbumSession } from "@/hooks/useAlbumSession";
import { copyText } from "@/lib/clipboard";
import { useState } from "react";
import { toast } from "sonner";
import { MainLayout } from "./components/app/MainLayout";
import { Onboarding } from "./components/app/Onboarding";

export default function App() {
  const { session, refresh, enterByFullCode, leaveLocal, updateSessionKeys } =
    useAlbumSession();
  const [welcomeCode, setWelcomeCode] = useState<string | null>(null);

  return (
    <TooltipProvider>
      {!session ? (
        <Onboarding
          enterByFullCode={enterByFullCode}
          onAlbumCreated={(full) => {
            setWelcomeCode(full);
            refresh();
          }}
          onSessionOpened={refresh}
        />
      ) : (
        <MainLayout
          session={session}
          leaveLocal={leaveLocal}
          updateSessionKeys={updateSessionKeys}
        />
      )}
      <AlertDialog
        open={!!welcomeCode}
        onOpenChange={(o) => {
          if (!o) setWelcomeCode(null);
        }}
      >
        <AlertDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto border-[var(--app-border)] bg-[var(--app-dialog-bg)] text-[var(--app-dialog-text)] ring-[var(--app-border)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Guarde este código</AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col gap-4 text-[var(--app-muted-text)]">
              <span>
                Sem o código abaixo não é possível recuperar o álbum. Quem
                possuir o código completo poderá editar suas figurinhas.
              </span>
              <code className="break-all rounded-md border border-[var(--app-border)] bg-[var(--app-field-bg)] p-2 text-sm text-[var(--app-dialog-text)]">
                {welcomeCode}
              </code>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 border-[var(--app-border-soft)] bg-transparent sm:flex-row">
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={() =>
                welcomeCode &&
                void copyText(welcomeCode).then(() => toast.success("Copiado."))
              }
            >
              Copiar código completo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster />
    </TooltipProvider>
  );
}
