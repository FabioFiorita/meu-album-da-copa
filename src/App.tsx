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
  const {
    session,
    refresh,
    enterByFullCode,
    leaveLocal,
    updateSessionKeys,
  } = useAlbumSession();
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
        onOpenChange={(o) => !o && setWelcomeCode(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guarde este código</AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col gap-4">
              <span>
                Sem o código abaixo não é possível recuperar o álbum. Quem
                possuir o código completo poderá editar suas figurinhas.
              </span>
              <code className="break-all rounded-md bg-muted px-2 py-2 text-sm">
                {welcomeCode}
              </code>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
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
