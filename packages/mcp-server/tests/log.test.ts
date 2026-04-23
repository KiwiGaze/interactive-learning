import { describe, expect, it } from "vitest";
import { createLogger } from "../src/log.js";

describe("logger", () => {
  it("defaults to info level on stderr", () => {
    const log = createLogger({ level: "info" });
    expect(log.level).toBe("info");
  });

  it("respects DEBUG=interactive-learning:* to raise level to debug", () => {
    const log = createLogger({ level: "info", debugEnv: "interactive-learning:*" });
    expect(log.level).toBe("debug");
  });

  it("respects DEBUG=interactive-learning (no suffix) as well", () => {
    const log = createLogger({ level: "info", debugEnv: "interactive-learning" });
    expect(log.level).toBe("debug");
  });
});
