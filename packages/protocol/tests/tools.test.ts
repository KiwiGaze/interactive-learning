import { describe, expect, it } from "vitest";
import {
  EndSessionInputSchema,
  RenderComponentInputSchema,
  UpdateComponentInputSchema,
  WaitForEventInputSchema,
} from "../src/tools.js";

describe("tool I/O schemas", () => {
  it("render_component accepts optional slot_id", () => {
    expect(() => RenderComponentInputSchema.parse({ type: "Quiz", props: {} })).not.toThrow();
  });

  it("update_component requires RFC 6902 patch", () => {
    const ok = UpdateComponentInputSchema.parse({
      slot_id: "s1",
      patch: [{ op: "replace", path: "/props/reveal_mode", value: "immediate" }],
    });
    expect(ok.patch[0].op).toBe("replace");
  });

  it("wait_for_event clamps timeout ≤ 30000ms", () => {
    expect(() => WaitForEventInputSchema.parse({ timeout_ms: 30001 })).toThrow();
  });

  it("end_session accepts empty input", () => {
    expect(EndSessionInputSchema.parse({})).toEqual({});
  });
});
