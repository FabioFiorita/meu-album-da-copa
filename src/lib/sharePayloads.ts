import type { MissingPayloadV1 } from "@convex/lib/sharePayloads";
import type { AlbumTemplateId } from "@convex/lib/templates";

const MISSING_PREFIX = "FIGUS_MISSING_V1.";

function utf8ToBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b !== undefined) bin += String.fromCharCode(b);
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

export function decodeMissingPayloadV1Client(raw: string): MissingPayloadV1 {
  const t = raw.trim();
  if (!t.startsWith(MISSING_PREFIX)) {
    throw new Error("INVALID_SHARE_PAYLOAD");
  }
  const b64 = t.slice(MISSING_PREFIX.length);
  const parsed = JSON.parse(base64UrlToUtf8(b64)) as MissingPayloadV1;
  if (
    parsed?.type !== "missing" ||
    parsed.version !== 1 ||
    parsed.templateId !== "wc2026" ||
    typeof parsed.albumCode !== "string" ||
    !Array.isArray(parsed.missingKeys)
  ) {
    throw new Error("INVALID_SHARE_PAYLOAD");
  }
  return parsed;
}

export function isMissingPayloadRaw(raw: string): boolean {
  return raw.trim().startsWith(MISSING_PREFIX);
}

export type ExportMissingInput = {
  templateId: AlbumTemplateId;
  albumCode: string;
  missingKeys: string[];
};

export function buildMissingExport(input: ExportMissingInput): string {
  return encodeMissingPayloadV1({
    type: "missing",
    version: 1,
    templateId: input.templateId,
    albumCode: input.albumCode,
    generatedAt: Date.now(),
    missingKeys: input.missingKeys,
  });
}
