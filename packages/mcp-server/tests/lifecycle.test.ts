import { describe, expect, it, vi } from "vitest";
import { Lifecycle } from "../src/lifecycle.js";

describe("Lifecycle", () => {
  it("does not start HTTP until ensureHttp() is called", async () => {
    const lc = new Lifecycle({ spaDir: "/tmp" });
    expect(lc.httpStarted).toBe(false);
  });

  it("calls open() exactly once per session", async () => {
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
