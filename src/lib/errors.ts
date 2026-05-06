import { ConvexError } from "convex/values";

export const ERROR_CODES = [
  "ALBUM_NOT_FOUND",
  "INVALID_WRITE_KEY",
  "INVALID_STICKER",
  "COMPARE_DISABLED",
  "TRADE_NOT_FOUND",
  "TRADE_STALE",
  "COUNT_LIMIT_EXCEEDED",
  "INVALID_SHARE_PAYLOAD",
] as const;

export type AppErrorCode = (typeof ERROR_CODES)[number];

export const ERROR_MESSAGES_PT: Record<AppErrorCode, string> = {
  ALBUM_NOT_FOUND: "Álbum não encontrado.",
  INVALID_WRITE_KEY: "Código ou chave inválidos.",
  INVALID_STICKER: "Figurinha inválida ou inexistente no álbum.",
  COMPARE_DISABLED: "Este álbum não permite comparação pública.",
  TRADE_NOT_FOUND: "Troca não encontrada.",
  TRADE_STALE: "A troca ficou desatualizada. Recalcule a comparação.",
  COUNT_LIMIT_EXCEEDED: "Quantidade além do limite permitido.",
  INVALID_SHARE_PAYLOAD: "Texto inválido ou formato de compartilhamento incorreto.",
};

export function extractErrorCode(err: unknown): AppErrorCode | null {
  if (err instanceof ConvexError) {
    const data = err.data as { code?: string };
    const c = data?.code;
    if (c && ERROR_CODES.includes(c as AppErrorCode)) {
      return c as AppErrorCode;
    }
  }
  if (err instanceof Error && err.message === "INVALID_SHARE_PAYLOAD") {
    return "INVALID_SHARE_PAYLOAD";
  }
  return null;
}

export function errorMessage(err: unknown): string {
  const code = extractErrorCode(err);
  if (code) return ERROR_MESSAGES_PT[code];
  if (err instanceof Error) return err.message;
  return "Ocorreu um erro.";
}
