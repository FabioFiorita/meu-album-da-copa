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
import { loadSession } from "@/lib/albumSession";
import { copyText } from "@/lib/clipboard";
import {
  buildJoinAlbumUrl,
  clearShareIntent,
  consumePendingTradeCode,
  parseShareIntent,
  savePendingTradeCode,
} from "@/lib/shareLinks";
import { normalizeAlbumCode } from "@convex/lib/access";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MainLayout } from "./components/app/MainLayout";
import { Onboarding } from "./components/app/Onboarding";
import { ShareQrPanel } from "./components/app/ShareQrPanel";

type StartupTab = "album" | "dupes" | "trade" | "search" | "config";
type StartupRoute = {
  tab: StartupTab | null;
  tradeCode: string | null;
};

export default function App() {
  const { session, refresh, enterByFullCode, leaveLocal, updateSessionKeys } =
    useAlbumSession();
  const [welcomeCode, setWelcomeCode] = useState<string | null>(null);
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);
  const [startupRoute, setStartupRoute] = useState<StartupRoute>(() => {
    const pendingTradeCode = session ? consumePendingTradeCode() : null;
    return {
      tab: pendingTradeCode ? "trade" : null,
      tradeCode: pendingTradeCode,
    };
  });

  const openTrade = useCallback(
    (publicCode: string) => {
      if (
        session &&
        normalizeAlbumCode(publicCode) === normalizeAlbumCode(session.code)
      ) {
        toast.error("Esse é o seu próprio código.");
        return;
      }
      setStartupRoute({ tab: "trade", tradeCode: publicCode });
    },
    [session],
  );

  const consumePendingTradeStartup = useCallback(() => {
    const pendingTradeCode = consumePendingTradeCode();
    if (!pendingTradeCode) return;
    const currentSession = loadSession();
    if (
      currentSession &&
      normalizeAlbumCode(pendingTradeCode) ===
        normalizeAlbumCode(currentSession.code)
    ) {
      toast.error("Esse é o seu próprio código.");
      return;
    }
    setStartupRoute({ tab: "trade", tradeCode: pendingTradeCode });
  }, []);

  function openPendingJoin() {
    if (!pendingJoinCode) return;
    if (enterByFullCode(pendingJoinCode)) {
      clearShareIntent();
      setPendingJoinCode(null);
      toast.success("Álbum aberto.");
      return;
    }
    toast.error("Código completo inválido.");
  }

  useEffect(() => {
    function handleShareIntent() {
      const intent = parseShareIntent();
      if (!intent) return;

      if (intent.type === "join") {
        if (session && session.fullAccessCode !== intent.fullAccessCode) {
          setPendingJoinCode(intent.fullAccessCode);
          return;
        }

        if (enterByFullCode(intent.fullAccessCode)) {
          clearShareIntent();
          setPendingJoinCode(null);
          toast.success("Álbum aberto.");
          return;
        }

        toast.error("Código completo inválido.");
        return;
      }

      if (session) {
        openTrade(intent.publicCode);
      } else {
        savePendingTradeCode(intent.publicCode);
        toast.success("Abra ou crie um álbum para comparar a troca.");
      }
      clearShareIntent();
    }

    handleShareIntent();
    window.addEventListener("hashchange", handleShareIntent);
    return () => window.removeEventListener("hashchange", handleShareIntent);
  }, [enterByFullCode, openTrade, session]);

  useEffect(() => {
    if (!session) return;
    const pendingTradeCode = consumePendingTradeCode();
    if (!pendingTradeCode) return;
    const timeoutId = window.setTimeout(() => {
      openTrade(pendingTradeCode);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [openTrade, session]);

  return (
    <TooltipProvider>
      {!session ? (
        <Onboarding
          enterByFullCode={enterByFullCode}
          onAlbumCreated={(full) => {
            setWelcomeCode(full);
            consumePendingTradeStartup();
            refresh();
          }}
          onSessionOpened={() => {
            consumePendingTradeStartup();
            refresh();
          }}
        />
      ) : (
        <MainLayout
          key={`${startupRoute.tab ?? "album"}:${startupRoute.tradeCode ?? ""}`}
          session={session}
          leaveLocal={leaveLocal}
          updateSessionKeys={updateSessionKeys}
          initialTab={startupRoute.tab ?? undefined}
          initialTradeCode={startupRoute.tradeCode ?? undefined}
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
            <AlertDialogDescription className="text-[var(--app-muted-text)]">
              Sem o código abaixo não é possível recuperar o álbum. Quem
              possuir o código completo poderá editar suas figurinhas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {welcomeCode && (
            <ShareQrPanel
              value={buildJoinAlbumUrl(welcomeCode)}
              title="Entrar neste álbum"
              description="Aponte a câmera de outro celular para abrir este álbum com acesso de edição."
              copyLabel="Copiar link"
              rawLabel="Código completo"
              rawValue={welcomeCode}
            />
          )}
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
      <AlertDialog
        open={!!pendingJoinCode}
        onOpenChange={(open) => {
          if (open) return;
          clearShareIntent();
          setPendingJoinCode(null);
        }}
      >
        <AlertDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto border-[var(--app-border)] bg-[var(--app-dialog-bg)] text-[var(--app-dialog-text)] ring-[var(--app-border)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar de álbum neste aparelho?</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--app-muted-text)]">
              O QR abre outro álbum com acesso de edição. Seu álbum atual só
              sairá deste aparelho; os dados dele não serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 border-[var(--app-border-soft)] bg-transparent sm:flex-row">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={openPendingJoin}>
              Abrir álbum do QR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster />
    </TooltipProvider>
  );
}
