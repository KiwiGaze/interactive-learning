import path from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerDefaultCatalog } from "./catalog-bindings.js";
import { CatalogRegistry } from "./catalog.js";
import { IdleWatchdog, Lifecycle } from "./lifecycle.js";
import { createLogger } from "./log.js";
import { buildServer } from "./server.js";
import { SessionStore } from "./session-store.js";

export function registerSignalHandlers(shutdown: (code: number) => void): () => void {
  const onSignal = (): void => shutdown(0);
  process.once("SIGTERM", onSignal);
  process.once("SIGINT", onSignal);
  return () => {
    process.off("SIGTERM", onSignal);
    process.off("SIGINT", onSignal);
  };
}

export async function main(): Promise<void> {
  const log = createLogger();
  const store = new SessionStore();
  const catalog = new CatalogRegistry();
  registerDefaultCatalog(catalog);

  const here = path.dirname(fileURLToPath(import.meta.url));
  const spaDir = path.resolve(here, "..", "spa");
  const lifecycle = new Lifecycle({ spaDir, store, catalog });
  const watchdog = new IdleWatchdog(store, {
    warnMs: 25 * 60_000,
    terminateMs: 30 * 60_000,
    onWarn: () => log.warn("session idle 25m"),
    onTerminate: () => {
      log.info("idle shutdown");
      void shutdown(0);
    },
  });
  watchdog.start();
  const { server } = buildServer({
    store,
    catalog,
    beforeToolCall: async () => {
      watchdog.ping();
      await lifecycle.ensureHttp();
    },
  });

  async function shutdown(code: number): Promise<void> {
    try {
      await lifecycle.shutdown();
    } catch {
      // ignore errors during shutdown
    }
    watchdog.stop();
    process.exit(code);
  }
  registerSignalHandlers((code) => {
    void shutdown(code);
  });

  const transport = new StdioServerTransport();
  transport.onclose = () => {
    void shutdown(0);
  };
  await server.connect(transport);
  log.info({ session_id: store.id }, "MCP server started");
}
