import {
  ArrowLeftRightIcon,
  FlipHorizontalIcon,
  SearchIcon,
  SettingsIcon,
  TrophyIcon,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { AlbumTab } from "./AlbumTab";
import { AlbumSnapshotProvider } from "@/hooks/useAlbumSnapshot";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Spinner } from "@/components/ui/spinner";
import type { AlbumSession } from "@/lib/albumSession";
import {
  applyAppTheme,
  type AppTheme,
  readStoredTheme,
  saveAppTheme,
} from "@/lib/appTheme";
import { cn } from "@/lib/utils";

const RepetidasTab = lazy(() =>
  import("./RepetidasTab").then((m) => ({ default: m.RepetidasTab })),
);
const TrocarTab = lazy(() =>
  import("./TrocarTab").then((m) => ({ default: m.TrocarTab })),
);
const BuscaTab = lazy(() =>
  import("./BuscaTab").then((m) => ({ default: m.BuscaTab })),
);
const ConfigTab = lazy(() =>
  import("./ConfigTab").then((m) => ({ default: m.ConfigTab })),
);

function TabFallback() {
  return (
    <div
      className="flex min-h-[40vh] w-full items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-7 text-[var(--app-gold)]" />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

const tabs = [
  { id: "album", label: "Álbum", Icon: TrophyIcon },
  { id: "dupes", label: "Repetidas", Icon: FlipHorizontalIcon },
  { id: "trade", label: "Trocar", Icon: ArrowLeftRightIcon },
  { id: "search", label: "Busca+", Icon: SearchIcon },
  { id: "config", label: "Config", Icon: SettingsIcon },
] as const;

export type TabId = (typeof tabs)[number]["id"];

type Props = {
  session: AlbumSession;
  leaveLocal: () => void;
  updateSessionKeys: (
    code: string,
    writeKey: string,
    fullAccessCode: string,
  ) => void;
  initialTab?: TabId;
  initialTradeCode?: string;
};

export function MainLayout({
  session,
  leaveLocal,
  updateSessionKeys,
  initialTab,
  initialTradeCode,
}: Props) {
  const [tab, setTab] = useState<TabId>(initialTab ?? "album");
  const [theme, setThemeState] = useState<AppTheme>(() => readStoredTheme());
  const isOnline = useOnlineStatus();

  useEffect(() => {
    applyAppTheme(theme);
    saveAppTheme(theme);
  }, [theme]);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.scrollTo({ left: 0, top: 0 });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  function setTheme(nextTheme: AppTheme) {
    setThemeState(nextTheme);
  }

  return (
    <div
      data-theme={theme}
      className="app-shell relative isolate flex h-dvh min-h-dvh flex-col overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]"
    >
      <header className="sticky top-0 z-30 shrink-0 border-b border-[var(--app-border-soft)] bg-[var(--app-chrome)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-[430px] items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] shadow-[0_0_18px_rgba(214,180,93,0.12)]">
            <img
              src={`${import.meta.env.BASE_URL}logo-64.webp`}
              alt="Meu álbum da Copa"
              width={28}
              height={28}
              className="size-7 rounded-lg object-cover object-center"
            />
          </span>
          <span className="truncate text-base font-black leading-none tracking-normal text-[var(--app-text)]">
            Meu álbum da Copa
          </span>
        </div>
      </header>

      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="relative z-20 shrink-0 border-b border-[var(--app-border-soft)] bg-[var(--destructive)]/10 px-4 py-2 text-2xs font-bold text-[var(--app-text)] sm:px-6"
        >
          <p className="mx-auto w-full max-w-[430px] leading-snug">
            Você está offline — as alterações podem não salvar.
          </p>
        </div>
      )}

      <AlbumSnapshotProvider session={session}>
        <main
          data-app-scroll-container
          className="relative z-10 min-h-0 flex-1 touch-manipulation overflow-auto px-4 sm:px-6"
        >
          {tab === "album" && <AlbumTab session={session} />}
          <Suspense fallback={<TabFallback />}>
            {tab === "dupes" && <RepetidasTab session={session} />}
            {tab === "trade" && (
              <TrocarTab session={session} initialOtherCode={initialTradeCode} />
            )}
            {tab === "search" && <BuscaTab session={session} />}
            {tab === "config" && (
              <ConfigTab
                session={session}
                leaveLocal={leaveLocal}
                updateSessionKeys={updateSessionKeys}
                theme={theme}
                setTheme={setTheme}
              />
            )}
          </Suspense>
        </main>
      </AlbumSnapshotProvider>

      <footer className="app-footer relative z-30 shrink-0 border-t border-[var(--app-border-soft)] bg-[var(--app-chrome)] px-3 pb-[env(safe-area-inset-bottom,0px)] pt-2 backdrop-blur sm:px-4">
        <nav
          aria-label="Navegação principal"
          className="mx-auto grid h-[62px] w-full max-w-[430px] shrink-0 grid-cols-5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-nav-bg)] p-1 shadow-[0_-12px_36px_rgba(0,0,0,0.24)]"
        >
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
              className={cn(
                "flex h-[52px] min-w-0 items-center justify-center rounded-xl px-1 py-1 transition-colors",
                tab === id
                  ? "border border-[var(--app-nav-active-border)] bg-[var(--app-nav-active)] text-[var(--app-nav-active-text)]"
                  : "border border-transparent text-[var(--app-nav-text)]",
              )}
            >
              <span className="flex h-full flex-col items-center justify-center gap-1">
                <Icon className="size-[18px]" />
                <span className="text-xs font-black leading-none tracking-normal">
                  {label}
                </span>
              </span>
            </button>
          ))}
        </nav>
      </footer>
    </div>
  );
}
