import { SearchIcon, SettingsIcon, TrophyIcon, FlipHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlbumTab } from "./AlbumTab";
import { BuscaTab } from "./BuscaTab";
import { ConfigTab } from "./ConfigTab";
import { RepetidasTab } from "./RepetidasTab";
import type { AlbumSession } from "@/lib/albumSession";

const tabs = [
  { id: "album", label: "Álbum", Icon: TrophyIcon },
  { id: "dupes", label: "Repetidas", Icon: FlipHorizontalIcon },
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
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as TabId)}
      className="flex min-h-dvh flex-col bg-background"
    >
      <header className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <img
          src="/logo.png"
          alt="Meu álbum da Copa"
          width={32}
          height={32}
          className="size-8 shrink-0 rounded-md object-contain"
        />
        <span className="truncate text-sm font-semibold tracking-tight">
          Meu álbum da Copa
        </span>
      </header>
      <div className="flex-1 overflow-auto px-4 sm:px-6">
        {tab === "album" && <AlbumTab session={session} />}
        {tab === "dupes" && <RepetidasTab session={session} />}
        {tab === "search" && <BuscaTab session={session} />}
        {tab === "config" && (
          <ConfigTab
            session={session}
            leaveLocal={leaveLocal}
            updateSessionKeys={updateSessionKeys}
          />
        )}
      </div>
      <div className="sticky bottom-0 z-10 border-t bg-background px-2 pb-[env(safe-area-inset-bottom)] sm:px-4">
        <TabsList className="grid h-14 w-full grid-cols-4 rounded-none bg-background p-0">
          {tabs.map(({ id, label, Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="flex flex-col gap-0.5 rounded-none data-[state=active]:bg-muted"
            >
              <Icon className="size-4" />
              <span className="text-[10px] font-medium">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
