import { describe, expect, it } from "vitest";
import { useSessionStore } from "../../src/state/session-store.js";

describe("reconnect reconcile", () => {
  it("applies snapshot and subsequent events preserve state", () => {
    useSessionStore.setState({
      sessionId: "",
      cursor: "",
      slots: [],
      connected: false,
      sessionEnded: false,
    });

    useSessionStore.getState().applySnapshot({
      id: "s1",
      started_at: 0,
      cursor: "018f-a",
      browser_connected: true,
      last_agent_tool_call: 0,
      slots: [{ slot_id: "slot-1", version: 1, type: "Markdown", props: {} }],
      recent_events: [],
    });

    expect(useSessionStore.getState().slots).toHaveLength(1);
    expect(useSessionStore.getState().cursor).toBe("018f-a");

    useSessionStore.getState().onRemoteEvent({
      event_id: "018f-b",
      timestamp: 1,
      slot_id: "slot-1",
      slot_version: 1,
      type: "component.updated",
      payload: {},
    });
    expect(useSessionStore.getState().cursor).toBe("018f-b");
    expect(useSessionStore.getState().slots).toHaveLength(1);
  });

  it("ignores snapshots older than the current cursor", () => {
    useSessionStore.setState({
      sessionId: "s1",
      cursor: "018f-c",
      slots: [{ slot_id: "slot-1", version: 2, type: "Markdown", props: { content: "new" } }],
      connected: true,
      sessionEnded: false,
    });

    useSessionStore.getState().applySnapshot({
      id: "s1",
      started_at: 0,
      cursor: "018f-b",
      browser_connected: true,
      last_agent_tool_call: 0,
      slots: [{ slot_id: "slot-1", version: 1, type: "Markdown", props: { content: "old" } }],
      recent_events: [],
    });

    expect(useSessionStore.getState().cursor).toBe("018f-c");
    expect(useSessionStore.getState().slots[0]?.version).toBe(2);
  });
});
