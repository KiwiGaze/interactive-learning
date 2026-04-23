import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CatalogRegistry } from "../src/catalog.js";
import { buildHttpServer } from "../src/http.js";
import { SessionStore } from "../src/session-store.js";

describe("HTTP server", () => {
  let close: (() => Promise<void>) | null = null;
  afterEach(async () => {
    if (close) await close();
    close = null;
  });

  it("serves index.html at /", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(path.join(tmp, "index.html"), "<html>OK</html>");
    const { fastify, port } = await buildHttpServer({
      store: new SessionStore(),
      catalog: new CatalogRegistry(),
      spaDir: tmp,
      port: 0,
    });
    close = async () => {
      await fastify.close();
    };
    const res = await fetch(`http://127.0.0.1:${port}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("OK");
  });

  it("binds to 127.0.0.1 only (no 0.0.0.0)", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(path.join(tmp, "index.html"), "ok");
    const { fastify, port } = await buildHttpServer({
      store: new SessionStore(),
      catalog: new CatalogRegistry(),
      spaDir: tmp,
      port: 0,
    });
    close = async () => {
      await fastify.close();
    };
    const address = fastify.server.address();
    expect(typeof address === "object" && address ? address.address : "").toBe("127.0.0.1");
    expect(port).toBeGreaterThan(0);
  });
});
