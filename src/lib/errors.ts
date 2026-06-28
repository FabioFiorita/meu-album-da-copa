import { ConvexError } from "convex/values";

export const ERROR_CODES = [
  "ALBUM_NOT_FOUND",
  "INVALID_WRITE_KEY",
  "INVALID_STICKER",
  "COMPARE_DISABLED",
  "COUNT_LIMIT_EXCEEDED",
  "INVALID_SHARE_PAYLOAD",
  "CODE_ALLOCATION_FAILED",
] as const;

export type AppErrorCode = (typeof ERROR_CODES)[number];

export const ERROR_MESSAGES_PT: Record<AppErrorCode, string> = {
  ALBUM_NOT_FOUND: "Álbum não encontrado.",
  INVALID_WRITE_KEY: "Código ou chave inválidos.",
  INVALID_STICKER: "Figurinha inválida ou inexistente no álbum.",
  COMPARE_DISABLED: "Este álbum não permite comparação pública.",
  COUNT_LIMIT_EXCEEDED: "Quantidade além do limite permitido.",
  INVALID_SHARE_PAYLOAD: "Texto inválido ou formato de compartilhamento incorreto.",
  CODE_ALLOCATION_FAILED:
    "Não foi possível gerar um código para o álbum. Tente novamente.",
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
  // A ConvexError with an unrecognized code must not leak its raw `data` payload
  // (err.message stringifies it), so fall back to a generic message.
  if (err instanceof ConvexError) return "Ocorreu um erro.";
  if (err instanceof Error) return err.message;
  return "Ocorreu um erro.";
}
