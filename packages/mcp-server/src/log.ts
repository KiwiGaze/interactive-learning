import pino, { type Logger } from "pino";

export function createLogger(opts: { level?: string; debugEnv?: string } = {}): Logger {
  const debugEnv = opts.debugEnv ?? process.env.DEBUG ?? "";
  const level = /interactive-learning(:\*|$)/.test(debugEnv) ? "debug" : (opts.level ?? "info");
  return pino({ level, base: { pkg: "interactive-learning" } }, pino.destination(2));
}
