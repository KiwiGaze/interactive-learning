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

  it("render_component requires the props key even though props may be opaque", () => {
    expect(() => RenderComponentInputSchema.parse({ type: "Quiz" })).toThrow();
    expect(RenderComponentInputSchema.parse({ type: "Quiz", props: undefined })).toEqual({
      type: "Quiz",
      props: undefined,
    });
    expect(RenderComponentInputSchema.parse({ type: "Quiz", props: null }).props).toBeNull();
  });

  it("render_component accepts optional parent_slot", () => {
    const parsed = RenderComponentInputSchema.parse({
      parent_slot: "parent",
      type: "Quiz",
      props: {},
    });
    expect(parsed.parent_slot).toBe("parent");
  });

  it("render_component rejects empty parent_slot", () => {
    expect(() =>
      RenderComponentInputSchema.parse({ parent_slot: "", type: "Quiz", props: {} }),
    ).toThrow();
  });

  it("update_component requires RFC 6902 patch", () => {
    const ok = UpdateComponentInputSchema.parse({
      slot_id: "s1",
      patch: [{ op: "replace", path: "/props/reveal_mode", value: "immediate" }],
    });
    const firstPatch = ok.patch[0];
    expect(firstPatch).toBeDefined();
    expect(firstPatch?.op).toBe("replace");
  });

  it("wait_for_event clamps timeout ≤ 30000ms", () => {
    expect(() => WaitForEventInputSchema.parse({ timeout_ms: 30001 })).toThrow();
  });

  it("wait_for_event rejects empty since_cursor", () => {
    expect(() => WaitForEventInputSchema.parse({ since_cursor: "" })).toThrow();
  });

  it("end_session accepts empty input", () => {
    expect(EndSessionInputSchema.parse({})).toEqual({});
  });
});
