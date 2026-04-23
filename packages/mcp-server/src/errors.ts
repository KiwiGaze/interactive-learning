import { ZodError } from "zod";

export interface JsonRpcError extends Error {
  code: number;
  data: Record<string, unknown>;
}

export function toJsonRpcError(cause: unknown, extra: Record<string, unknown> = {}): JsonRpcError {
  if (cause instanceof ZodError) {
    const issues = cause.issues.map((i) => ({
      path: i.path,
      expected:
        "expected" in i && typeof (i as { expected?: unknown }).expected !== "undefined"
          ? String((i as { expected?: unknown }).expected)
          : i.code,
      received: "received" in i ? (i as { received?: unknown }).received : undefined,
      message: i.message,
    }));
    const err = new Error("Validation failed") as JsonRpcError;
    err.code = -32602;
    err.data = { issues, ...extra };
    return err;
  }
  if (cause instanceof Error) {
    // Read domainCode before mutating (err === cause, so err.code overwrites cause.code)
    const domainCode = (cause as { code?: unknown }).code;
    const err = cause as JsonRpcError;
    err.code = -32602;
    err.data = {
      reason: typeof domainCode === "string" ? domainCode : cause.name,
      message: cause.message,
      ...extra,
    };
    return err;
  }
  const err = new Error(String(cause)) as JsonRpcError;
  err.code = -32603;
  err.data = { reason: "INTERNAL", ...extra };
  return err;
}
