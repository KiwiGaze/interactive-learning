import { beforeEach, describe, expect, it } from "vitest";
import { useSessionStore } from "../../src/state/session-store.js";

describe("useSessionStore (zustand)", () => {
  beforeEach(() => {
    useSessionStore.setState({ sessionId: "", cursor: "", slots: [], connected: false });
  });

  it("upserts slots from snapshot", () => {
    const store = useSessionStore.getState();
    store.applySnapshot({
      id: "s",
      started_at: 0,
      cursor: "",
      browser_connected: true,
      last_agent_tool_call: 0,
      slots: [
        { slot_id: "a", version: 1, type: "Quiz", props: {} },
        { slot_id: "b", version: 3, type: "FlashCard", props: {} },
      ],
      recent_events: [],
    });
    expect(useSessionStore.getState().slots.length).toBe(2);
    expect(useSessionStore.getState().connected).toBe(true);
  });

  it("onRemoteEvent advances cursor", () => {
    const store = useSessionStore.getState();
    store.onRemoteEvent({
      event_id: "018f-1",
      timestamp: 1,
      slot_id: "a",
      slot_version: 1,
      type: "component.updated",
      payload: {},
    });
    expect(useSessionStore.getState().cursor).toBe("018f-1");
  });

  it("sets sessionEnded=true on session.ended event", () => {
    useSessionStore.setState({ sessionEnded: false });
    useSessionStore.getState().onRemoteEvent({
      event_id: "018f-end",
      timestamp: 1,
      slot_id: "__session__",
      slot_version: 0,
      type: "session.ended",
      payload: {},
    });
    expect(useSessionStore.getState().sessionEnded).toBe(true);
  });
});
