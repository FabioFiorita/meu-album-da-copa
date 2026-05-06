import { appError } from "./errors";
import { getSectionTemplate } from "./templates";

export function parseStickerKey(key: string): { sectionId: string; number: string } {
  const k = key.trim().toUpperCase();
  const i = k.indexOf(":");
  if (i === -1) throw appError("INVALID_STICKER");
  return { sectionId: k.slice(0, i), number: k.slice(i + 1) };
}

function parseSectionAndRawNumber(input: string): { sectionId: string; raw: string } {
  const t = input.trim();
  const spaced = t.replace(/[:/]/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
  const parts = spaced.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    const sectionId = parts[0]!.toUpperCase();
    const raw = parts.slice(1).join("");
    return { sectionId, raw };
  }
  const m = t.match(/^([A-Za-z]{2,3})(\d[\d\s]*)$/i);
  if (m?.[1] && m[2]) {
    return { sectionId: m[1].toUpperCase(), raw: m[2].replace(/\s/g, "") };
  }
  throw appError("INVALID_STICKER");
}

function normalizeNumberForSection(
  templateId: string,
  sectionId: string,
  raw: string,
): string {
  getSectionTemplate(templateId, sectionId);
  const cleaned = raw.replace(/\s/g, "");
  if (sectionId === "FWC") {
    const n = parseInt(cleaned, 10);
    if (Number.isNaN(n) || n < 0 || n > 19) throw appError("INVALID_STICKER");
    return String(n).padStart(2, "0");
  }
  if (sectionId === "CC") {
    const n = parseInt(cleaned, 10);
    if (Number.isNaN(n) || n < 1 || n > 14) throw appError("INVALID_STICKER");
    return String(n);
  }
  const n = parseInt(cleaned, 10);
  if (Number.isNaN(n) || n < 1 || n > 20) throw appError("INVALID_STICKER");
  return String(n);
}

export function normalizeStickerKey(input: string, templateId: string): string {
  const { sectionId, raw } = parseSectionAndRawNumber(input);
  const number = normalizeNumberForSection(templateId, sectionId, raw);
  return `${sectionId}:${number}`;
}

export function buildStickerKey(
  templateId: string,
  sectionId: string,
  number: string,
): string {
  const sec = sectionId.trim().toUpperCase();
  const normalized = normalizeNumberForSection(templateId, sec, number.trim());
  return `${sec}:${normalized}`;
}
