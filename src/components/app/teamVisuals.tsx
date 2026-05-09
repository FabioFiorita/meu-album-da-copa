/* eslint-disable react-refresh/only-export-components -- This module intentionally shares team visual helpers with SectionIcon. */
import { TrophyIcon } from "lucide-react";
import { type CSSProperties, useState } from "react";
import type { AlbumSectionTemplate } from "@convex/lib/templates";

export type TeamTheme = {
  primary: string;
  secondary: string;
  accent: string;
  slot?: string;
  paper?: string;
  ink?: string;
};

export type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

const DEFAULT_TEAM_THEME: TeamTheme = {
  primary: "#1f7a3a",
  secondary: "#0f4f2a",
  accent: "#f6e37a",
};

const SPECIAL_THEME: TeamTheme = {
  primary: "#111111",
  secondary: "#2a2111",
  accent: "#d6b45d",
  paper: "#fff3d0",
  ink: "#2b2415",
};

const TEAM_THEMES: Record<string, TeamTheme> = {
  FWC: SPECIAL_THEME,
  CC: SPECIAL_THEME,
  CAN: { primary: "#d80621", secondary: "#f5f5f5", accent: "#d80621", slot: "#d80621" },
  MEX: { primary: "#006847", secondary: "#ffffff", accent: "#ce1126", slot: "#006847" },
  USA: { primary: "#002868", secondary: "#bf0a30", accent: "#ffffff", slot: "#002868" },
  BRA: { primary: "#009b3a", secondary: "#ffdf00", accent: "#002776", slot: "#4f9b55" },
  ARG: { primary: "#75aadb", secondary: "#ffffff", accent: "#f6b40e", slot: "#75aadb" },
  FRA: { primary: "#0055a4", secondary: "#ffffff", accent: "#ef4135", slot: "#0055a4" },
  ENG: { primary: "#ffffff", secondary: "#cf142b", accent: "#cf142b", slot: "#cf142b" },
  GER: { primary: "#000000", secondary: "#dd0000", accent: "#ffce00", slot: "#dd0000" },
  ESP: { primary: "#aa151b", secondary: "#f1bf00", accent: "#aa151b", slot: "#aa151b" },
  POR: { primary: "#006600", secondary: "#ff0000", accent: "#ffcc00", slot: "#006600" },
  NED: { primary: "#ff7f00", secondary: "#21468b", accent: "#ffffff", slot: "#ff7f00" },
  BEL: { primary: "#000000", secondary: "#ffd90c", accent: "#ef3340", slot: "#000000" },
  ITA: { primary: "#009246", secondary: "#ffffff", accent: "#ce2b37", slot: "#009246" },
  CRO: { primary: "#f00000", secondary: "#ffffff", accent: "#171796", slot: "#f00000" },
  URU: { primary: "#0038a8", secondary: "#ffffff", accent: "#fcd116", slot: "#0038a8" },
  COL: { primary: "#fcd116", secondary: "#003893", accent: "#ce1126", slot: "#003893" },
  MAR: { primary: "#c1272d", secondary: "#006233", accent: "#006233", slot: "#c1272d" },
  JPN: { primary: "#ffffff", secondary: "#bc002d", accent: "#bc002d", slot: "#bc002d" },
  KOR: { primary: "#ffffff", secondary: "#c60c30", accent: "#003478", slot: "#003478" },
  AUS: { primary: "#00247d", secondary: "#00843d", accent: "#ffcd00", slot: "#00247d" },
  IRN: { primary: "#239f40", secondary: "#ffffff", accent: "#da0000", slot: "#239f40" },
  KSA: { primary: "#006c35", secondary: "#0b8b49", accent: "#ffffff", slot: "#006c35" },
  QAT: { primary: "#8a1538", secondary: "#ffffff", accent: "#8a1538", slot: "#8a1538" },
  SEN: { primary: "#00853f", secondary: "#fdef42", accent: "#e31b23", slot: "#00853f" },
  EGY: { primary: "#ce1126", secondary: "#ffffff", accent: "#000000", slot: "#ce1126" },
  NGA: { primary: "#008751", secondary: "#ffffff", accent: "#008751", slot: "#008751" },
  GHA: { primary: "#ce1126", secondary: "#fcd116", accent: "#006b3f", slot: "#ce1126" },
  CIV: { primary: "#f77f00", secondary: "#ffffff", accent: "#009e60", slot: "#f77f00" },
  CMR: { primary: "#007a5e", secondary: "#ce1126", accent: "#fcd116", slot: "#007a5e" },
  RSA: { primary: "#007a4d", secondary: "#ffb612", accent: "#002395", slot: "#007a4d" },
  TUN: { primary: "#e70013", secondary: "#ffffff", accent: "#e70013", slot: "#e70013" },
  ALG: { primary: "#006233", secondary: "#ffffff", accent: "#d21034", slot: "#006233" },
  ECU: { primary: "#ffdd00", secondary: "#034ea2", accent: "#ed1c24", slot: "#034ea2" },
  PAR: { primary: "#d52b1e", secondary: "#ffffff", accent: "#0038a8", slot: "#d52b1e" },
  CHI: { primary: "#0039a6", secondary: "#ffffff", accent: "#d52b1e", slot: "#0039a6" },
  PER: { primary: "#d91023", secondary: "#ffffff", accent: "#d91023", slot: "#d91023" },
  VEN: { primary: "#ffcc00", secondary: "#00247d", accent: "#cf142b", slot: "#00247d" },
  BOL: { primary: "#d52b1e", secondary: "#f9e300", accent: "#007934", slot: "#007934" },
  JAM: { primary: "#009b3a", secondary: "#fed100", accent: "#000000", slot: "#009b3a" },
  CRC: { primary: "#002b7f", secondary: "#ffffff", accent: "#ce1126", slot: "#002b7f" },
  PAN: { primary: "#005293", secondary: "#ffffff", accent: "#d21034", slot: "#005293" },
  HON: { primary: "#00a3e0", secondary: "#ffffff", accent: "#00a3e0", slot: "#00a3e0" },
  CZE: { primary: "#11457e", secondary: "#ffffff", accent: "#d7141a", slot: "#11457e" },
  POL: { primary: "#dc143c", secondary: "#ffffff", accent: "#dc143c", slot: "#dc143c" },
  SRB: { primary: "#c6363c", secondary: "#0c4076", accent: "#ffffff", slot: "#c6363c" },
  SUI: { primary: "#d52b1e", secondary: "#f5f5f5", accent: "#ffffff", slot: "#d52b1e" },
  DEN: { primary: "#c60c30", secondary: "#ffffff", accent: "#ffffff", slot: "#c60c30" },
  SCO: { primary: "#005eb8", secondary: "#ffffff", accent: "#ffffff", slot: "#005eb8" },
  WAL: { primary: "#00a650", secondary: "#ffffff", accent: "#c8102e", slot: "#00a650" },
  IRL: { primary: "#169b62", secondary: "#ffffff", accent: "#ff883e", slot: "#169b62" },
  BIH: { primary: "#002395", secondary: "#f7d116", accent: "#ffffff", slot: "#002395" },
  HAI: { primary: "#00209f", secondary: "#d21034", accent: "#ffffff", slot: "#00209f" },
  TUR: { primary: "#e30a17", secondary: "#ffffff", accent: "#ffffff", slot: "#e30a17" },
  CUR: { primary: "#002b7f", secondary: "#f9e814", accent: "#ffffff", slot: "#002b7f" },
  SWE: { primary: "#006aa7", secondary: "#fecc00", accent: "#fecc00", slot: "#006aa7" },
  NZL: { primary: "#00247d", secondary: "#cc142b", accent: "#ffffff", slot: "#00247d" },
  CPV: { primary: "#003893", secondary: "#ffffff", accent: "#cf2027", slot: "#003893" },
  IRQ: { primary: "#ce1126", secondary: "#ffffff", accent: "#000000", slot: "#ce1126" },
  NOR: { primary: "#ba0c2f", secondary: "#ffffff", accent: "#00205b", slot: "#ba0c2f" },
  AUT: { primary: "#ed2939", secondary: "#ffffff", accent: "#ffffff", slot: "#ed2939" },
  JOR: { primary: "#000000", secondary: "#ffffff", accent: "#007a3d", slot: "#ce1126" },
  COD: { primary: "#00a3e0", secondary: "#f7d618", accent: "#ce1021", slot: "#00a3e0" },
  UZB: { primary: "#1eb5e5", secondary: "#ffffff", accent: "#009739", slot: "#1eb5e5" },
};

export function getTeamTheme(sectionId: string) {
  return TEAM_THEMES[sectionId] ?? DEFAULT_TEAM_THEME;
}

export function sectionStyle(theme: TeamTheme): ThemeStyle {
  return {
    "--team-primary": theme.primary,
    "--team-secondary": theme.secondary,
    "--team-accent": theme.accent,
    backgroundColor: theme.primary,
    borderColor: theme.accent,
  };
}

export function slotStyle(theme: TeamTheme, owned: boolean): ThemeStyle {
  const slotColor = theme.slot ?? theme.primary;
  return {
    "--slot-paper": theme.paper ?? "#fff4fb",
    "--slot-ink": theme.ink ?? "#4d5360",
    backgroundColor: slotColor,
    borderColor: owned ? theme.accent : "rgba(255, 255, 255, 0.34)",
  };
}

export function CocaColaIcon() {
  return (
    <svg viewBox="0 0 32 32" className="size-full" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#e41f26" />
      <path
        d="M13.1 5.5h5.8v3.2c0 .8.4 1.5.9 2.1 1 1.1 1.7 2.5 1.7 4v9.5c0 1.2-1 2.2-2.2 2.2h-6.6c-1.2 0-2.2-1-2.2-2.2v-9.5c0-1.5.7-2.9 1.7-4 .6-.6.9-1.3.9-2.1z"
        fill="#ffffff"
      />
      <path
        d="M13.6 5h4.8c.5 0 .9.4.9.9v2.3c0 .5-.4.9-.9.9h-4.8a.9.9 0 0 1-.9-.9V5.9c0-.5.4-.9.9-.9Z"
        fill="#f7d7d7"
      />
      <path
        d="M10.5 15.1h11v6.6h-11z"
        fill="#e41f26"
      />
      <path
        d="M12.1 19.3c2.7-2.4 5.3-2.4 7.8-.2"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
      <text x="16" y="18.2" fill="#fff" fontFamily="Arial, sans-serif" fontSize="4.8" fontWeight="900" textAnchor="middle">
        cola
      </text>
    </svg>
  );
}

export function SectionIcon({ section }: { section: AlbumSectionTemplate }) {
  const [failed, setFailed] = useState(false);

  if (section.id === "FWC") {
    return <TrophyIcon className="size-4 text-[#ffd65c]" />;
  }

  if (section.id === "CC") {
    return <CocaColaIcon />;
  }

  if (failed) {
    return (
      <span className="text-[9px] font-black leading-none tracking-normal text-[#101010]">
        {section.id.slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      src={`${import.meta.env.BASE_URL}flags/${section.id}.svg`}
      alt=""
      aria-hidden="true"
      className="size-full rounded-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
