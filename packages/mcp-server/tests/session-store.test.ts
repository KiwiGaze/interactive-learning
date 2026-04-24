import { beforeEach, describe, expect, it } from "vitest";
import { SessionStore } from "../src/session-store.js";

describe("SessionStore", () => {
  let store: SessionStore;
  beforeEach(() => {
    store = new SessionStore();
  });

  it("renders a new slot with auto-generated id and version=1", () => {
    const { slot_id, cursor } = store.render({ type: "Quiz", props: { questions: [] } });
    expect(slot_id).toMatch(/^slot-/);
    expect(store.getSlot(slot_id)?.version).toBe(1);
    expect(cursor).toBeDefined();
  });

  it("replace=true bumps version and drops in-flight events for that slot", () => {
    const { slot_id } = store.render({ type: "Quiz", props: {} });
    store.recordEvent({ slot_id, slot_version: 1, type: "quiz.x", payload: {} });
    const { cursor } = store.render({
      slot_id,
      type: "Quiz",
      props: { title: "v2" },
      replace: true,
    });
    expect(store.getSlot(slot_id)?.version).toBe(2);
    const tail = store.eventsAfter(cursor);
    expect(tail).toHaveLength(0);
  });

  it("render on existing id without replace returns error", () => {
    const { slot_id } = store.render({ type: "Quiz", props: {} });
    expect(() => store.render({ slot_id, type: "Quiz", props: {} })).toThrow(/INVALID_OPERATION/);
  });

  it("update applies JSON Patch; failure rolls back whole patch AND emits no event", () => {
    const { slot_id } = store.render({ type: "Quiz", props: { title: "a" } });
    const cursorBefore = store.currentCursor();
    store.update({ slot_id, patch: [{ op: "replace", path: "/title", value: "b" }] });
    expect(store.getSlot(slot_id)?.props).toMatchObject({ title: "b" });
    const afterOk = store.currentCursor();
    expect(afterOk).not.toBe(cursorBefore);

    expect(() =>
      store.update({
        slot_id,
        patch: [
          { op: "replace", path: "/title", value: "c" },
          { op: "test", path: "/nonexistent", value: 1 },
        ],
      }),
    ).toThrow();
    expect(store.getSlot(slot_id)?.props).toMatchObject({ title: "b" });
    // Failed update must not emit a `component.updated` event nor advance cursor.
    expect(store.currentCursor()).toBe(afterOk);
  });

  it("update runs validator before commit; validator rejection emits no event", () => {
    const { slot_id } = store.render({ type: "Quiz", props: { title: "a" } });
    const cursorBefore = store.currentCursor();
    const reject = () => {
      throw new Error("ZOD_FAIL: bad props");
    };
    expect(() =>
      store.update({ slot_id, patch: [{ op: "replace", path: "/title", value: "b" }] }, reject),
    ).toThrow(/ZOD_FAIL/);
    expect(store.getSlot(slot_id)?.props).toMatchObject({ title: "a" });
    expect(store.currentCursor()).toBe(cursorBefore);
  });

  it("cursor advances monotonically; events never missed", () => {
    const a = store.recordEvent({ slot_id: "s", slot_version: 1, type: "e.a", payload: {} });
    const b = store.recordEvent({ slot_id: "s", slot_version: 1, type: "e.b", payload: {} });
    expect(a.event_id < b.event_id).toBe(true);
    expect(store.eventsAfter(undefined).map((e) => e.type)).toEqual(["e.a", "e.b"]);
    expect(store.eventsAfter(a.event_id).map((e) => e.type)).toEqual(["e.b"]);
  });

  it("eventsAfter rejects empty string cursors", () => {
    store.recordEvent({ slot_id: "s", slot_version: 1, type: "e.a", payload: {} });
    expect(() => store.eventsAfter("")).toThrow(/CURSOR_EXPIRED/);
  });

  it("ring buffer capacity = 1000", () => {
    for (let i = 0; i < 1005; i++) {
      store.recordEvent({ slot_id: "s", slot_version: 1, type: "e.x", payload: i });
    }
    expect(store.eventCount()).toBe(1000);
  });

  it("eventsAfter returns CURSOR_EXPIRED when cursor was evicted", () => {
    const firstCursor = store.recordEvent({
      slot_id: "s",
      slot_version: 1,
      type: "e.x",
      payload: 0,
    }).event_id;
    for (let i = 0; i < 1005; i++) {
      store.recordEvent({ slot_id: "s", slot_version: 1, type: "e.x", payload: i + 1 });
    }
    expect(() => store.eventsAfter(firstCursor)).toThrow(/CURSOR_EXPIRED/);
  });

  it("eventsAfter with unknown-but-not-evicted cursor also returns CURSOR_EXPIRED", () => {
    expect(() => store.eventsAfter("018f0000-0000-7000-8000-000000000000")).toThrow(
      /CURSOR_EXPIRED/,
    );
  });
});
