// Stub for S.4; full JSON-RPC error mapping lives in S.16.
export function toJsonRpcError(cause: unknown, extra?: Record<string, unknown>) {
  const err = new Error(cause instanceof Error ? cause.message : String(cause));
  (err as { code?: number }).code = -32602;
  (err as { data?: unknown }).data = { cause: String(cause), ...extra };
  return err;
}
