import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FALLBACK_PORT, allocatePort, portLockPath, releasePortLock } from "../src/port.js";

describe("allocatePort", () => {
  let homeDir: string;
  const previousHome = process.env.INTERACTIVE_LEARNING_HOME;

  beforeEach(async () => {
    homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "interactive-learning-port-"));
    process.env.INTERACTIVE_LEARNING_HOME = homeDir;
  });

  afterEach(async () => {
    await releasePortLock();
    await fs.rm(homeDir, { recursive: true, force: true });
    if (previousHome === undefined) {
      process.env.INTERACTIVE_LEARNING_HOME = undefined;
    } else {
      process.env.INTERACTIVE_LEARNING_HOME = previousHome;
    }
  });

  it("creates a lockfile under the interactive-learning home", async () => {
    const port = await allocatePort();
    const raw = await fs.readFile(portLockPath(homeDir), "utf8");
    expect(JSON.parse(raw)).toMatchObject({ pid: process.pid, port });
  });

  it("removes stale PID lock entries", async () => {
    await fs.mkdir(path.dirname(portLockPath(homeDir)), { recursive: true });
    await fs.writeFile(
      portLockPath(homeDir),
      JSON.stringify({ pid: 999_999_999, port: FALLBACK_PORT, updated_at: Date.now() }),
    );

    const port = await allocatePort();

    expect(port).toBe(FALLBACK_PORT);
    const raw = await fs.readFile(portLockPath(homeDir), "utf8");
    expect(JSON.parse(raw)).toMatchObject({ pid: process.pid, port: FALLBACK_PORT });
  });

  it("respects active PID lock entries", async () => {
    await fs.mkdir(path.dirname(portLockPath(homeDir)), { recursive: true });
    await fs.writeFile(
      portLockPath(homeDir),
      JSON.stringify({ pid: process.pid, port: FALLBACK_PORT, updated_at: Date.now() }),
    );

    const port = await allocatePort();

    expect(port).not.toBe(FALLBACK_PORT);
    expect(port).toBeGreaterThanOrEqual(49152);
    expect(port).toBeLessThanOrEqual(65535);
  });

  it("does not claim the same port for concurrent allocators", async () => {
    const ports = await Promise.all([allocatePort(), allocatePort()]);

    expect(new Set(ports).size).toBe(2);
  });
});
