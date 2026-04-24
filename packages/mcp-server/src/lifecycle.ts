import open from "open";
import type { CatalogRegistry } from "./catalog.js";
import { buildHttpServer } from "./http.js";
import { MAX_RETRIES, allocatePort, releasePortLock } from "./port.js";
import type { SessionStore } from "./session-store.js";
import { attachWebSocket } from "./ws.js";

export interface LifecycleDeps {
  spaDir: string;
  store?: SessionStore;
  catalog?: CatalogRegistry;
  open?: (url: string) => Promise<unknown>;
  startHttp?: (port: number) => Promise<{ port: number; close: () => Promise<void> }>;
}

export class Lifecycle {
  httpStarted = false;
  private port: number | undefined;
  private closers: Array<() => Promise<void>> = [];
  private readonly opener: (url: string) => Promise<unknown>;
  private readonly customStart: LifecycleDeps["startHttp"] | undefined;
  private ensureHttpPromise: Promise<number> | undefined;

  constructor(private readonly deps: LifecycleDeps) {
    this.opener = deps.open ?? ((url) => open(url));
    this.customStart = deps.startHttp;
  }

  async ensureHttp(): Promise<number> {
    if (this.httpStarted && this.port != null) return this.port;
    this.ensureHttpPromise ??= this.startOnce().finally(() => {
      this.ensureHttpPromise = undefined;
    });
    return this.ensureHttpPromise;
  }

  private async startOnce(): Promise<number> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const port = await allocatePort();
      try {
        if (this.customStart) {
          const handle = await this.customStart(port);
          this.port = handle.port;
          this.closers.push(handle.close);
        } else {
          if (!this.deps.store || !this.deps.catalog) throw new Error("store+catalog required");
          const { fastify, port: bound } = await buildHttpServer({
            store: this.deps.store,
            catalog: this.deps.catalog,
            spaDir: this.deps.spaDir,
            port,
          });
          attachWebSocket(fastify.server, this.deps.store, {
            allowedOrigins: [`http://127.0.0.1:${bound}`, `http://localhost:${bound}`],
          });
          this.port = bound;
          this.closers.push(async () => {
            await fastify.close();
          });
        }
        this.httpStarted = true;
        await this.opener(`http://127.0.0.1:${this.port}/`);
        return this.port;
      } catch (error) {
        if (isAddressInUse(error) && attempt < MAX_RETRIES) continue;
        throw error;
      }
    }
    throw new Error("PORT_EXHAUSTED: no free port after retries");
  }

  async shutdown(): Promise<void> {
    for (const c of this.closers.reverse()) await c();
    this.closers = [];
    this.httpStarted = false;
    this.port = undefined;
    await releasePortLock();
  }
}

function isAddressInUse(error: unknown): boolean {
  return error instanceof Error && (error as NodeJS.ErrnoException).code === "EADDRINUSE";
}

export interface IdleWatchdogOptions {
  warnMs: number;
  terminateMs: number;
  onWarn: () => void;
  onTerminate: () => void;
}

export class IdleWatchdog {
  private warnTimer: NodeJS.Timeout | undefined;
  private termTimer: NodeJS.Timeout | undefined;

  constructor(
    private readonly store: { lastAgentToolCall: number },
    private readonly opts: IdleWatchdogOptions,
  ) {}

  start(): void {
    this.ping();
  }

  ping(): void {
    if (this.warnTimer) clearTimeout(this.warnTimer);
    if (this.termTimer) clearTimeout(this.termTimer);
    this.warnTimer = setTimeout(this.opts.onWarn, this.opts.warnMs);
    this.termTimer = setTimeout(this.opts.onTerminate, this.opts.terminateMs);
  }

  stop(): void {
    if (this.warnTimer) clearTimeout(this.warnTimer);
    if (this.termTimer) clearTimeout(this.termTimer);
  }
}
