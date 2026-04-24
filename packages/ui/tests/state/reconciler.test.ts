import type { SessionSnapshot } from "@interactive-learning/protocol";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueuedReconciler } from "../../src/state/reconciler.js";
import { useSessionStore } from "../../src/state/session-store.js";

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

function snapshot(cursor: string, content: string, version: number): SessionSnapshot {
  return {
    id: "session-1",
    started_at: 0,
    cursor,
    browser_connected: true,
    last_agent_tool_call: 0,
    slots: [{ slot_id: "slot-1", version, type: "Markdown", props: { content } }],
    recent_events: [],
  };
}

describe("createQueuedReconciler", () => {
  beforeEach(() => {
    useSessionStore.setState({
      sessionId: "",
      cursor: "",
      slots: [],
      connected: false,
      sessionEnded: false,
    });
  });

  it("runs a follow-up snapshot fetch when reconcile is requested during an in-flight fetch", async () => {
    const firstSnapshot = deferred<SessionSnapshot>();
    const secondSnapshot = deferred<SessionSnapshot>();
    const fetchSnapshot = vi
      .fn<() => Promise<SessionSnapshot>>()
      .mockReturnValueOnce(firstSnapshot.promise)
      .mockReturnValueOnce(secondSnapshot.promise);
    const reconcile = createQueuedReconciler({
      fetchSnapshot,
      applySnapshot: (value) => useSessionStore.getState().applySnapshot(value),
      isActive: () => true,
    });

    const firstReconcile = reconcile();
    useSessionStore.getState().onRemoteEvent({
      event_id: "018f-b",
      timestamp: 1,
      slot_id: "slot-1",
      slot_version: 2,
      type: "component.updated",
      payload: {},
    });
    const queuedReconcile = reconcile();

    firstSnapshot.resolve(snapshot("018f-a", "old", 1));
    await Promise.resolve();
    expect(fetchSnapshot).toHaveBeenCalledTimes(2);

    secondSnapshot.resolve(snapshot("018f-b", "fresh", 2));
    await Promise.all([firstReconcile, queuedReconcile]);

    expect(useSessionStore.getState().slots[0]).toMatchObject({
      version: 2,
      props: { content: "fresh" },
    });
  });
});
