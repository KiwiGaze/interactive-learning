import type { WaitForEventInputSchema } from "@interactive-learning/protocol";
import { beforeEach, describe, expect, it } from "vitest";
import type { z } from "zod";
import { SessionStore } from "../../src/session-store.js";
import { waitForEventHandler } from "../../src/tools/wait-for-event.js";

describe("wait_for_event handler", () => {
  let store: SessionStore;
  beforeEach(() => {
    store = new SessionStore();
  });

  it("returns immediately if events already exist after cursor", async () => {
    store.recordEvent({ slot_id: "s", slot_version: 1, type: "quiz.x", payload: {} });
    const out = await waitForEventHandler({
      store,
      input: { timeout_ms: 100 },
    });
    expect(out.events.length).toBeGreaterThan(0);
    const last = out.events.at(-1);
    expect(last).toBeDefined();
    expect(out.next_cursor).toBe(last?.event_id);
  });

  it("blocks until an event is recorded, then returns", async () => {
    const p = waitForEventHandler({ store, input: { timeout_ms: 500 } });
    setTimeout(() => {
      store.recordEvent({ slot_id: "s", slot_version: 1, type: "quiz.y", payload: {} });
    }, 50);
    const out = await p;
    expect(out.events).toHaveLength(1);
  });

  it("returns empty events and unchanged cursor on timeout", async () => {
    const before = store.currentCursor();
    const out = await waitForEventHandler({
      store,
      input: { timeout_ms: 50 },
    });
    expect(out.events).toEqual([]);
    expect(out.next_cursor).toBe(before);
  });

  it("clamps timeout to <= 30000ms via schema", async () => {
    await expect(
      waitForEventHandler({
        store,
        input: { timeout_ms: 31_000 } as z.input<typeof WaitForEventInputSchema>,
      }),
    ).rejects.toBeDefined();
  });

  it("surfaces CURSOR_EXPIRED as JSON-RPC error when cursor is unknown", async () => {
    await expect(
      waitForEventHandler({ store, input: { since_cursor: "018f-stale-cursor", timeout_ms: 50 } }),
    ).rejects.toMatchObject({ code: "CURSOR_EXPIRED" });
  });

  it("rejects empty since_cursor at the schema boundary", async () => {
    await expect(
      waitForEventHandler({ store, input: { since_cursor: "", timeout_ms: 50 } }),
    ).rejects.toBeDefined();
  });
});
