import { appError } from "./errors";
import type { AlbumTemplateId } from "./templates";

export type MissingPayloadV1 = {
  type: "missing";
  version: 1;
  templateId: AlbumTemplateId;
  albumCode: string;
  generatedAt: number;
  missingKeys: string[];
};

export type DuplicatesPayloadV1 = {
  type: "duplicates";
  version: 1;
  templateId: AlbumTemplateId;
  albumCode: string;
  generatedAt: number;
  duplicates: Array<{ key: string; quantity: number }>;
};

const MISSING_PREFIX = "FIGUS_MISSING_V1.";
const DUPES_PREFIX = "FIGUS_DUPES_V1.";

function utf8ToBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]!);
  }
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToUtf8(b64url: string): string {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i)!;
  }
  return new TextDecoder().decode(bytes);
}

export function encodeMissingPayloadV1(data: MissingPayloadV1): string {
  return MISSING_PREFIX + utf8ToBase64Url(JSON.stringify(data));
}

export function encodeDuplicatesPayloadV1(data: DuplicatesPayloadV1): string {
  return DUPES_PREFIX + utf8ToBase64Url(JSON.stringify(data));
}

export function decodeMissingPayloadV1(raw: string): MissingPayloadV1 {
  const t = raw.trim();
  if (!t.startsWith(MISSING_PREFIX)) throw appError("INVALID_SHARE_PAYLOAD");
  const b64 = t.slice(MISSING_PREFIX.length);
  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlToUtf8(b64)) as MissingPayloadV1;
  } catch {
    throw appError("INVALID_SHARE_PAYLOAD");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as MissingPayloadV1).type !== "missing" ||
    (parsed as MissingPayloadV1).version !== 1 ||
    (parsed as MissingPayloadV1).templateId !== "wc2026" ||
    typeof (parsed as MissingPayloadV1).albumCode !== "string" ||
    !Array.isArray((parsed as MissingPayloadV1).missingKeys)
  ) {
    throw appError("INVALID_SHARE_PAYLOAD");
  }
  return parsed as MissingPayloadV1;
}

export function decodeDuplicatesPayloadV1(raw: string): DuplicatesPayloadV1 {
  const t = raw.trim();
  if (!t.startsWith(DUPES_PREFIX)) throw appError("INVALID_SHARE_PAYLOAD");
  const b64 = t.slice(DUPES_PREFIX.length);
  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlToUtf8(b64)) as DuplicatesPayloadV1;
  } catch {
    throw appError("INVALID_SHARE_PAYLOAD");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as DuplicatesPayloadV1).type !== "duplicates" ||
    (parsed as DuplicatesPayloadV1).version !== 1 ||
    (parsed as DuplicatesPayloadV1).templateId !== "wc2026" ||
    typeof (parsed as DuplicatesPayloadV1).albumCode !== "string" ||
    !Array.isArray((parsed as DuplicatesPayloadV1).duplicates)
  ) {
    throw appError("INVALID_SHARE_PAYLOAD");
  }
  return parsed as DuplicatesPayloadV1;
}

export function isMissingPayloadRaw(raw: string): boolean {
  return raw.trim().startsWith(MISSING_PREFIX);
}

export function isDupesPayloadRaw(raw: string): boolean {
  return raw.trim().startsWith(DUPES_PREFIX);
}
