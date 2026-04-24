import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { Lifecycle } from "../src/lifecycle.js";
import { releasePortLock } from "../src/port.js";

describe("Lifecycle", () => {
  async function withPortHome<T>(fn: () => Promise<T>): Promise<T> {
    const previousHome = process.env.INTERACTIVE_LEARNING_HOME;
    const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "interactive-learning-lifecycle-"));
    process.env.INTERACTIVE_LEARNING_HOME = homeDir;
    try {
      return await fn();
    } finally {
      await releasePortLock();
      await fs.rm(homeDir, { recursive: true, force: true });
      if (previousHome === undefined) {
        process.env.INTERACTIVE_LEARNING_HOME = undefined;
      } else {
        process.env.INTERACTIVE_LEARNING_HOME = previousHome;
      }
    }
  }

  it("does not start HTTP until ensureHttp() is called", async () => {
    const lc = new Lifecycle({ spaDir: "/tmp" });
    expect(lc.httpStarted).toBe(false);
  });

  it("calls open() exactly once per session", async () => {
    await withPortHome(async () => {
      const openMock = vi.fn<(url: string) => Promise<unknown>>().mockResolvedValue(undefined);
      const lc = new Lifecycle({
        spaDir: "/tmp",
        open: openMock,
        startHttp: async () => ({ port: 7654, close: async () => {} }),
      });
      await lc.ensureHttp();
      await lc.ensureHttp();
      expect(openMock).toHaveBeenCalledTimes(1);
      expect(openMock).toHaveBeenCalledWith("http://127.0.0.1:7654/");
      await lc.shutdown();
    });
  });

  it("starts HTTP once for concurrent ensureHttp calls", async () => {
    await withPortHome(async () => {
      const startHttp = vi.fn(async () => ({ port: 7654, close: async () => {} }));
      const lc = new Lifecycle({
        spaDir: "/tmp",
        open: vi.fn<(url: string) => Promise<unknown>>().mockResolvedValue(undefined),
        startHttp,
      });

      await Promise.all([lc.ensureHttp(), lc.ensureHttp()]);

      expect(startHttp).toHaveBeenCalledTimes(1);
      await lc.shutdown();
    });
  });
});
