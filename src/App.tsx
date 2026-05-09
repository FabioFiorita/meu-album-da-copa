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
        <AlertDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto bg-[#1f1f1f] text-white ring-[#d5b15e]/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Guarde este código</AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col gap-4 text-white/72">
              <span>
                Sem o código abaixo não é possível recuperar o álbum. Quem
                possuir o código completo poderá editar suas figurinhas.
              </span>
              <code className="break-all rounded-md border border-[#d5b15e]/35 bg-black/35 px-2 py-2 text-sm text-white">
                {welcomeCode}
              </code>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 border-[#d5b15e]/20 bg-black/18 sm:flex-row">
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
