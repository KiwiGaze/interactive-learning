import { SessionSnapshotSchema } from "@interactive-learning/protocol";
import { describe, expect, it } from "vitest";
import { readSessionStateResource } from "../../src/resources/session-state.js";
import { SessionStore } from "../../src/session-store.js";

describe("session://current/state", () => {
  it("returns a Snapshot conforming to SessionSnapshotSchema", async () => {
    const store = new SessionStore();
    store.render({ type: "Quiz", props: {} });
    const out = await readSessionStateResource({ store });
    const first = out.contents[0];
    expect(first).toBeDefined();
    const body = JSON.parse(first?.text ?? "{}");
    expect(() => SessionSnapshotSchema.parse(body)).not.toThrow();
  });
});
