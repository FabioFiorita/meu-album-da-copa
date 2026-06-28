const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const FULL_ACCESS_PREFIX = "FIGUS_ALBUM_V1.";

export function normalizeAlbumCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
}

export function normalizeWriteKey(writeKey: string): string {
  return writeKey.trim().toUpperCase().replace(/\s+/g, "");
}

function pickChars(length: number): string {
  // Cryptographically secure character picking with rejection sampling to
  // avoid modulo bias against the 30-char ALPHABET. The album code and the
  // 24-char writeKey (the only edit secret) depend on this being unbiased.
  // Accept only bytes below the largest multiple of ALPHABET.length that fits
  // in a byte (240 for 30 chars); reject 240-255 so every char is equiprobable.
  const max = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  let s = "";
  while (s.length < length) {
    const bytes = new Uint8Array(length - s.length);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte >= max) continue;
      s += ALPHABET.charAt(byte % ALPHABET.length);
      if (s.length === length) break;
    }
  }
  return s;
}

export function createAlbumCode(): string {
  const a = pickChars(4);
  const b = pickChars(4);
  const c = pickChars(2);
  return `${a}-${b}-${c}`;
}

export function createWriteKey(): string {
  return pickChars(24);
}

export function createFullAccessCode(code: string, writeKey: string): string {
  return `${FULL_ACCESS_PREFIX}${normalizeAlbumCode(code)}.${normalizeWriteKey(writeKey)}`;
}

export function parseFullAccessCode(
  input: string,
): { code: string; writeKey: string } | null {
  const t = input.trim();
  if (!t.startsWith(FULL_ACCESS_PREFIX)) return null;
  const rest = t.slice(FULL_ACCESS_PREFIX.length);
  const dot = rest.indexOf(".");
  if (dot === -1) return null;
  const codeRaw = rest.slice(0, dot);
  const writeKeyRaw = rest.slice(dot + 1);
  if (!codeRaw || !writeKeyRaw || writeKeyRaw.includes(".")) return null;
  const code = normalizeAlbumCode(codeRaw);
  const writeKey = normalizeWriteKey(writeKeyRaw);
  if (code.length < 8 || writeKey.length < 16) return null;
  return { code, writeKey };
}

export function createKeySalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashWriteKey(
  writeKey: string,
  salt: string,
): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${writeKey}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export async function verifyWriteKey(
  writeKey: string,
  salt: string,
  hash: string,
): Promise<boolean> {
  const computed = await hashWriteKey(writeKey, salt);
  if (computed.length !== hash.length) return false;
  let ok = 0;
  for (let i = 0; i < computed.length; i++) {
    ok |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return ok === 0;
}
