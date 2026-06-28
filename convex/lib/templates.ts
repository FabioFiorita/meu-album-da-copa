import { appError } from "./errors";

export type AlbumTemplateId = "wc2026";

export type StickerTemplate = {
  key: string;
  sectionId: string;
  number: string;
  displayNumber: string;
};

export type AlbumSectionTemplate = {
  id: string;
  title: string;
  kind: "special" | "country" | "sponsor" | "other";
  emoji?: string;
  total: number;
  stickers: StickerTemplate[];
};

export type AlbumTemplate = {
  id: AlbumTemplateId;
  title: string;
  total: number;
  sections: AlbumSectionTemplate[];
};

const COUNTRY_META: Array<{ id: string; title: string; emoji?: string }> = [
  { id: "MEX", title: "México", emoji: "🇲🇽" },
  { id: "RSA", title: "África do Sul", emoji: "🇿🇦" },
  { id: "KOR", title: "Coreia do Sul", emoji: "🇰🇷" },
  { id: "CZE", title: "República Tcheca", emoji: "🇨🇿" },
  { id: "CAN", title: "Canadá", emoji: "🇨🇦" },
  { id: "BIH", title: "Bósnia e Herzegovina", emoji: "🇧🇦" },
  { id: "QAT", title: "Catar", emoji: "🇶🇦" },
  { id: "SUI", title: "Suíça", emoji: "🇨🇭" },
  { id: "BRA", title: "Brasil", emoji: "🇧🇷" },
  { id: "MAR", title: "Marrocos", emoji: "🇲🇦" },
  { id: "HAI", title: "Haiti", emoji: "🇭🇹" },
  { id: "SCO", title: "Escócia", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { id: "USA", title: "Estados Unidos", emoji: "🇺🇸" },
  { id: "PAR", title: "Paraguai", emoji: "🇵🇾" },
  { id: "AUS", title: "Austrália", emoji: "🇦🇺" },
  { id: "TUR", title: "Turquia", emoji: "🇹🇷" },
  { id: "GER", title: "Alemanha", emoji: "🇩🇪" },
  { id: "CUW", title: "Curaçao", emoji: "🇨🇼" },
  { id: "CIV", title: "Costa do Marfim", emoji: "🇨🇮" },
  { id: "ECU", title: "Equador", emoji: "🇪🇨" },
  { id: "NED", title: "Holanda", emoji: "🇳🇱" },
  { id: "JPN", title: "Japão", emoji: "🇯🇵" },
  { id: "SWE", title: "Suécia", emoji: "🇸🇪" },
  { id: "TUN", title: "Tunísia", emoji: "🇹🇳" },
  { id: "BEL", title: "Bélgica", emoji: "🇧🇪" },
  { id: "EGY", title: "Egito", emoji: "🇪🇬" },
  { id: "IRN", title: "Irã", emoji: "🇮🇷" },
  { id: "NZL", title: "Nova Zelândia", emoji: "🇳🇿" },
  { id: "ESP", title: "Espanha", emoji: "🇪🇸" },
  { id: "CPV", title: "Cabo Verde", emoji: "🇨🇻" },
  { id: "KSA", title: "Arábia Saudita", emoji: "🇸🇦" },
  { id: "URU", title: "Uruguai", emoji: "🇺🇾" },
  { id: "FRA", title: "França", emoji: "🇫🇷" },
  { id: "SEN", title: "Senegal", emoji: "🇸🇳" },
  { id: "IRQ", title: "Iraque", emoji: "🇮🇶" },
  { id: "NOR", title: "Noruega", emoji: "🇳🇴" },
  { id: "ARG", title: "Argentina", emoji: "🇦🇷" },
  { id: "ALG", title: "Argélia", emoji: "🇩🇿" },
  { id: "AUT", title: "Áustria", emoji: "🇦🇹" },
  { id: "JOR", title: "Jordânia", emoji: "🇯🇴" },
  { id: "POR", title: "Portugal", emoji: "🇵🇹" },
  { id: "COD", title: "RD Congo", emoji: "🇨🇩" },
  { id: "UZB", title: "Uzbequistão", emoji: "🇺🇿" },
  { id: "COL", title: "Colômbia", emoji: "🇨🇴" },
  { id: "ENG", title: "Inglaterra", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "CRO", title: "Croácia", emoji: "🇭🇷" },
  { id: "GHA", title: "Gana", emoji: "🇬🇭" },
  { id: "PAN", title: "Panamá", emoji: "🇵🇦" },
];

function buildFwcSection(): AlbumSectionTemplate {
  const stickers: StickerTemplate[] = [];
  for (let i = 0; i < 20; i++) {
    const number = String(i).padStart(2, "0");
    stickers.push({
      key: `FWC:${number}`,
      sectionId: "FWC",
      number,
      displayNumber: number,
    });
  }
  return {
    id: "FWC",
    title: "Capa",
    kind: "special",
    emoji: "⭐",
    total: 20,
    stickers,
  };
}

function buildCcSection(): AlbumSectionTemplate {
  const stickers: StickerTemplate[] = [];
  for (let n = 1; n <= 14; n++) {
    const number = String(n);
    stickers.push({
      key: `CC:${number}`,
      sectionId: "CC",
      number,
      displayNumber: number,
    });
  }
  return {
    id: "CC",
    title: "Coleção Coca-Cola",
    kind: "sponsor",
    emoji: "🥤",
    total: 14,
    stickers,
  };
}

function buildCountrySection(meta: { id: string; title: string; emoji?: string }): AlbumSectionTemplate {
  const stickers: StickerTemplate[] = [];
  for (let n = 1; n <= 20; n++) {
    const number = String(n);
    stickers.push({
      key: `${meta.id}:${number}`,
      sectionId: meta.id,
      number,
      displayNumber: number,
    });
  }
  return {
    id: meta.id,
    title: meta.title,
    kind: "country",
    emoji: meta.emoji,
    total: 20,
    stickers,
  };
}

const fwc = buildFwcSection();
const cc = buildCcSection();
const countries = COUNTRY_META.map(buildCountrySection);

export const WC_2026_TEMPLATE: AlbumTemplate = {
  id: "wc2026",
  title: "Álbum Copa do Mundo 2026",
  total: fwc.total + cc.total + countries.reduce((s, c) => s + c.total, 0),
  sections: [fwc, cc, ...countries],
};

const TEMPLATES: Record<AlbumTemplateId, AlbumTemplate> = {
  wc2026: WC_2026_TEMPLATE,
};

const stickerIndex = new Map<string, Map<string, StickerTemplate>>();

for (const template of Object.values(TEMPLATES)) {
  const byKey = new Map<string, StickerTemplate>();
  for (const section of template.sections) {
    for (const st of section.stickers) {
      byKey.set(st.key, st);
    }
  }
  stickerIndex.set(template.id, byKey);
}

export function getTemplate(templateId: AlbumTemplateId): AlbumTemplate {
  const t = TEMPLATES[templateId];
  if (!t) {
    throw appError("INVALID_STICKER");
  }
  return t;
}

export function getSectionTemplate(
  templateId: string,
  sectionId: string,
): AlbumSectionTemplate {
  const t = getTemplate(templateId as AlbumTemplateId);
  const sec = t.sections.find((s) => s.id === sectionId);
  if (!sec) {
    throw appError("INVALID_STICKER");
  }
  return sec;
}

export function getAllStickerKeys(templateId: string): string[] {
  const t = getTemplate(templateId as AlbumTemplateId);
  return t.sections.flatMap((s) => s.stickers.map((x) => x.key));
}

export function assertStickerExists(
  templateId: string,
  stickerKey: string,
): StickerTemplate {
  const idx = stickerIndex.get(templateId as AlbumTemplateId);
  if (!idx) {
    throw appError("INVALID_STICKER");
  }
  const st = idx.get(stickerKey);
  if (!st) {
    throw appError("INVALID_STICKER");
  }
  return st;
}

export function stickerExists(templateId: string, stickerKey: string): boolean {
  const idx = stickerIndex.get(templateId as AlbumTemplateId);
  if (!idx) return false;
  return idx.has(stickerKey);
}
