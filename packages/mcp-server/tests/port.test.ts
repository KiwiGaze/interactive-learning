import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { FALLBACK_PORT, allocatePort } from "../src/port.js";

describe("allocatePort", () => {
  it("returns fallback port when free", async () => {
    const port = await allocatePort();
    expect(typeof port).toBe("number");
    expect(port).toBeGreaterThanOrEqual(1024);
  });

  it("falls back to random when fallback is taken", async () => {
    const hog = createServer();
    await new Promise<void>((r) => hog.listen(FALLBACK_PORT, "127.0.0.1", r));
    try {
      const port = await allocatePort();
      expect(port).not.toBe(FALLBACK_PORT);
      expect(port).toBeGreaterThanOrEqual(49152);
      expect(port).toBeLessThanOrEqual(65535);
    } finally {
      await new Promise<void>((r) => hog.close(() => r()));
    }
  });
});
