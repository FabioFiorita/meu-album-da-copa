import {
  ArrowLeftRightIcon,
  FlipHorizontalIcon,
  SearchIcon,
  SettingsIcon,
  TrophyIcon,
} from "lucide-react";
import { useState } from "react";
import { AlbumTab } from "./AlbumTab";
import { BuscaTab } from "./BuscaTab";
import { ConfigTab } from "./ConfigTab";
import { RepetidasTab } from "./RepetidasTab";
import { TrocarTab } from "./TrocarTab";
import type { AlbumSession } from "@/lib/albumSession";

const tabs = [
  { id: "album", label: "Álbum", Icon: TrophyIcon },
  { id: "dupes", label: "Repetidas", Icon: FlipHorizontalIcon },
  { id: "trade", label: "Trocar", Icon: ArrowLeftRightIcon },
  { id: "search", label: "Busca+", Icon: SearchIcon },
  { id: "config", label: "Config", Icon: SettingsIcon },
] as const;

type TabId = (typeof tabs)[number]["id"];

type Props = {
  session: AlbumSession;
  leaveLocal: () => void;
  updateSessionKeys: (code: string, writeKey: string, fullAccessCode: string) => void;
};

export function MainLayout({ session, leaveLocal, updateSessionKeys }: Props) {
  const [tab, setTab] = useState<TabId>("album");

  return (
    <div className="app-shell relative isolate flex h-dvh min-h-dvh flex-col overflow-hidden bg-[#050606] text-white">
      <header className="sticky top-0 z-30 shrink-0 border-b border-[#d6b45d]/20 bg-[#050606]/92 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-[430px] items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#d6b45d]/45 bg-[#151515] shadow-[0_0_18px_rgba(214,180,93,0.12)]">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Meu álbum da Copa"
              width={28}
              height={28}
              className="size-7 rounded-lg object-cover object-center"
            />
          </span>
          <span className="truncate text-[15px] font-black leading-none tracking-normal text-white">
            Meu álbum da Copa
          </span>
        </div>
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-auto px-4 sm:px-6">
        {tab === "album" && <AlbumTab session={session} />}
        {tab === "dupes" && <RepetidasTab session={session} />}
        {tab === "trade" && <TrocarTab session={session} />}
        {tab === "search" && <BuscaTab session={session} />}
        {tab === "config" && (
          <ConfigTab
            session={session}
            leaveLocal={leaveLocal}
            updateSessionKeys={updateSessionKeys}
          />
        )}
      </div>

      <footer className="relative z-30 shrink-0 border-t border-[#d6b45d]/25 bg-[#050606]/92 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:px-4">
        <nav
          aria-label="Navegação principal"
          className="mx-auto grid h-[62px] w-full max-w-[430px] shrink-0 grid-cols-5 rounded-2xl border border-[#d6b45d]/35 bg-[#151515]/95 p-1 shadow-[0_-12px_36px_rgba(0,0,0,0.42)]"
        >
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
              className={`flex h-[52px] min-w-0 items-center justify-center rounded-xl px-1 py-1 text-[#d8d8d8]/70 transition-colors ${
                tab === id
                  ? "border border-[#d6b45d]/45 bg-[linear-gradient(180deg,rgba(19,174,91,0.34),rgba(16,16,16,0.45))] text-[#35e66f]"
                  : "border border-transparent"
              }`}
            >
              <span className="flex h-full flex-col items-center justify-center gap-1">
                <Icon className="size-[18px]" />
                <span className="text-[10px] font-black leading-none tracking-normal">{label}</span>
              </span>
            </button>
          ))}
        </nav>
      </footer>
    </div>
  );
}
