import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const FALLBACK_PORT = 7654;
export const RANDOM_MIN = 49152;
export const RANDOM_MAX = 65535;
export const MAX_RETRIES = 5;
let allocationQueue: Promise<void> = Promise.resolve();

export interface PortLockEntry {
  pid: number;
  port: number;
  updated_at: number;
}

export function portLockPath(homeDir = os.homedir()): string {
  return path.join(
    process.env.INTERACTIVE_LEARNING_HOME ?? homeDir,
    "interactive-learning",
    "ports.lock",
  );
}

export async function allocatePort(): Promise<number> {
  const previous = allocationQueue;
  let releaseQueue: () => void = () => {};
  allocationQueue = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });
  await previous;
  try {
    return await allocatePortUnsafe();
  } finally {
    releaseQueue();
  }
}

async function allocatePortUnsafe(): Promise<number> {
  await removeStalePortLock();
  const locked = await readPortLock();
  const port = locked?.port === FALLBACK_PORT ? randomPort() : FALLBACK_PORT;
  await writePortLock({ pid: process.pid, port, updated_at: Date.now() });
  return port;
}

export async function releasePortLock(): Promise<void> {
  const lock = await readPortLock();
  if (!lock || lock.pid !== process.pid) return;
  await fs.rm(portLockPath(), { force: true });
}

async function readPortLock(): Promise<PortLockEntry | undefined> {
  try {
    const raw = await fs.readFile(portLockPath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<PortLockEntry>;
    if (
      typeof parsed.pid !== "number" ||
      typeof parsed.port !== "number" ||
      typeof parsed.updated_at !== "number"
    ) {
      return undefined;
    }
    return { pid: parsed.pid, port: parsed.port, updated_at: parsed.updated_at };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function writePortLock(entry: PortLockEntry): Promise<void> {
  const filePath = portLockPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.rm(filePath, { force: true });
  const handle = await fs.open(filePath, "wx");
  try {
    await handle.writeFile(`${JSON.stringify(entry)}\n`);
  } finally {
    await handle.close();
  }
}

async function removeStalePortLock(): Promise<void> {
  const lock = await readPortLock();
  if (!lock) return;
  try {
    process.kill(lock.pid, 0);
  } catch {
    await fs.rm(portLockPath(), { force: true });
  }
}

function randomPort(): number {
  return Math.floor(Math.random() * (RANDOM_MAX - RANDOM_MIN + 1)) + RANDOM_MIN;
}
