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
  { id: "CAN", title: "Canadá", emoji: "🇨🇦" },
  { id: "MEX", title: "México", emoji: "🇲🇽" },
  { id: "USA", title: "Estados Unidos", emoji: "🇺🇸" },
  { id: "BRA", title: "Brasil", emoji: "🇧🇷" },
  { id: "ARG", title: "Argentina", emoji: "🇦🇷" },
  { id: "FRA", title: "França", emoji: "🇫🇷" },
  { id: "ENG", title: "Inglaterra", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "GER", title: "Alemanha", emoji: "🇩🇪" },
  { id: "ESP", title: "Espanha", emoji: "🇪🇸" },
  { id: "POR", title: "Portugal", emoji: "🇵🇹" },
  { id: "NED", title: "Holanda", emoji: "🇳🇱" },
  { id: "BEL", title: "Bélgica", emoji: "🇧🇪" },
  { id: "ITA", title: "Itália", emoji: "🇮🇹" },
  { id: "CRO", title: "Croácia", emoji: "🇭🇷" },
  { id: "URU", title: "Uruguai", emoji: "🇺🇾" },
  { id: "COL", title: "Colômbia", emoji: "🇨🇴" },
  { id: "MAR", title: "Marrocos", emoji: "🇲🇦" },
  { id: "JPN", title: "Japão", emoji: "🇯🇵" },
  { id: "KOR", title: "Coreia do Sul", emoji: "🇰🇷" },
  { id: "AUS", title: "Austrália", emoji: "🇦🇺" },
  { id: "IRN", title: "Irã", emoji: "🇮🇷" },
  { id: "KSA", title: "Arábia Saudita", emoji: "🇸🇦" },
  { id: "QAT", title: "Catar", emoji: "🇶🇦" },
  { id: "SEN", title: "Senegal", emoji: "🇸🇳" },
  { id: "EGY", title: "Egito", emoji: "🇪🇬" },
  { id: "NGA", title: "Nigéria", emoji: "🇳🇬" },
  { id: "GHA", title: "Gana", emoji: "🇬🇭" },
  { id: "CIV", title: "Costa do Marfim", emoji: "🇨🇮" },
  { id: "CMR", title: "Camarões", emoji: "🇨🇲" },
  { id: "RSA", title: "África do Sul", emoji: "🇿🇦" },
  { id: "TUN", title: "Tunísia", emoji: "🇹🇳" },
  { id: "ALG", title: "Argélia", emoji: "🇩🇿" },
  { id: "ECU", title: "Equador", emoji: "🇪🇨" },
  { id: "PAR", title: "Paraguai", emoji: "🇵🇾" },
  { id: "CHI", title: "Chile", emoji: "🇨🇱" },
  { id: "PER", title: "Peru", emoji: "🇵🇪" },
  { id: "VEN", title: "Venezuela", emoji: "🇻🇪" },
  { id: "BOL", title: "Bolívia", emoji: "🇧🇴" },
  { id: "JAM", title: "Jamaica", emoji: "🇯🇲" },
  { id: "CRC", title: "Costa Rica", emoji: "🇨🇷" },
  { id: "PAN", title: "Panamá", emoji: "🇵🇦" },
  { id: "HON", title: "Honduras", emoji: "🇭🇳" },
  { id: "CZE", title: "República Tcheca", emoji: "🇨🇿" },
  { id: "POL", title: "Polônia", emoji: "🇵🇱" },
  { id: "SRB", title: "Sérvia", emoji: "🇷🇸" },
  { id: "SUI", title: "Suíça", emoji: "🇨🇭" },
  { id: "DEN", title: "Dinamarca", emoji: "🇩🇰" },
  { id: "SCO", title: "Escócia", emoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { id: "WAL", title: "País de Gales", emoji: "🏴󠁧󠁢󠁷󠁬󠁳󠁿" },
  { id: "IRL", title: "Irlanda", emoji: "🇮🇪" },
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
    title: "FWC",
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
    title: "CC",
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
    throw new Error(`Unknown template: ${templateId}`);
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
    throw new Error(`Unknown section: ${sectionId}`);
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
    throw new Error(`Unknown template: ${templateId}`);
  }
  const st = idx.get(stickerKey);
  if (!st) {
    throw new Error(`Unknown sticker: ${stickerKey}`);
  }
  return st;
}

export function stickerExists(templateId: string, stickerKey: string): boolean {
  const idx = stickerIndex.get(templateId as AlbumTemplateId);
  if (!idx) return false;
  return idx.has(stickerKey);
}
