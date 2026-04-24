import { describe, expect, it } from "vitest";
import { EventEnvelopeSchema, RESERVED_EVENT_PREFIXES } from "../src/events.js";

describe("EventEnvelopeSchema", () => {
  it("accepts a well-formed envelope", () => {
    const parsed = EventEnvelopeSchema.parse({
      event_id: "018f6a1e-0000-7000-8000-000000000001",
      timestamp: 1713800000000,
      slot_id: "slot-1",
      slot_version: 1,
      type: "quiz.answer_submitted",
      payload: { question_id: "q1", value: "b" },
    });
    expect(parsed.type).toBe("quiz.answer_submitted");
  });

  it("rejects missing slot_version (no silent fill)", () => {
    expect(() =>
      EventEnvelopeSchema.parse({
        event_id: "018f6a1e-0000-7000-8000-000000000001",
        timestamp: 1,
        slot_id: "s",
        type: "quiz.foo",
        payload: {},
      } as unknown),
    ).toThrow();
  });

  it("requires the payload key while accepting explicit undefined", () => {
    const envelope = {
      event_id: "018f6a1e-0000-7000-8000-000000000001",
      timestamp: 1713800000000,
      slot_id: "slot-1",
      slot_version: 1,
      type: "quiz.answer_submitted",
    };

    expect(() => EventEnvelopeSchema.parse(envelope)).toThrow();
    expect(EventEnvelopeSchema.parse({ ...envelope, payload: undefined }).payload).toBeUndefined();
  });

  it("exports reserved prefixes for namespace guarding", () => {
    expect(RESERVED_EVENT_PREFIXES).toEqual(["component.", "session."]);
  });
});
