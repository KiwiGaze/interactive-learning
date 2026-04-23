import { describe, expect, it } from "vitest";
import { SessionStore } from "../../src/session-store.js";
import { endSessionHandler } from "../../src/tools/end-session.js";

describe("end_session", () => {
  it("emits session.ended event with reason", async () => {
    const store = new SessionStore();
    const before = store.currentCursor();
    const out = await endSessionHandler({ store, input: { reason: "done" } });
    expect(out).toEqual({});
    const evs = store.eventsAfter(before);
    expect(evs.map((e) => e.type)).toContain("session.ended");
    const ended = evs.find((e) => e.type === "session.ended");
    expect(ended).toBeDefined();
    expect(ended?.payload).toMatchObject({ reason: "done" });
  });
});
