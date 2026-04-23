import { createServer } from "node:http";

export const FALLBACK_PORT = 7654;
export const RANDOM_MIN = 49152;
export const RANDOM_MAX = 65535;
export const MAX_RETRIES = 5;

export async function allocatePort(): Promise<number> {
  if (await isFree(FALLBACK_PORT)) return FALLBACK_PORT;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const p = Math.floor(Math.random() * (RANDOM_MAX - RANDOM_MIN + 1)) + RANDOM_MIN;
    if (await isFree(p)) return p;
  }
  throw new Error("PORT_EXHAUSTED: no free port after retries");
}

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = createServer();
    s.once("error", () => resolve(false));
    s.listen(port, "127.0.0.1", () => s.close(() => resolve(true)));
  });
}
