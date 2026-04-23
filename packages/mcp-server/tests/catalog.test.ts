import { RESERVED_EVENT_PREFIXES } from "@interactive-learning/protocol";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CatalogRegistry } from "../src/catalog.js";

describe("CatalogRegistry", () => {
  it("validates props against registered schema", () => {
    const reg = new CatalogRegistry();
    reg.register({
      type: "Quiz",
      props: z.object({ title: z.string() }),
      events: { "quiz.answered": z.object({ question_id: z.string() }) },
    });
    expect(() => reg.validateProps("Quiz", { title: "hi" })).not.toThrow();
    expect(() => reg.validateProps("Quiz", { title: 1 })).toThrow();
  });

  it("rejects unknown component type", () => {
    const reg = new CatalogRegistry();
    expect(() => reg.validateProps("Unknown", {})).toThrow(/UNKNOWN_COMPONENT/);
  });

  it("throws at registration if event names use reserved prefix", () => {
    const reg = new CatalogRegistry();
    expect(() =>
      reg.register({
        type: "X",
        props: z.object({}),
        events: { "component.illegal": z.object({}) },
      }),
    ).toThrow(/RESERVED_NAMESPACE/);
    expect(() =>
      reg.register({
        type: "Y",
        props: z.object({}),
        events: { "session.illegal": z.object({}) },
      }),
    ).toThrow(/RESERVED_NAMESPACE/);
    expect(RESERVED_EVENT_PREFIXES.length).toBeGreaterThan(0);
  });

  it("serializes to JSON schema for catalog resource", () => {
    const reg = new CatalogRegistry();
    reg.register({ type: "Quiz", props: z.object({ title: z.string() }), events: {} });
    const json = reg.toJson();
    expect(json.components[0]?.type).toBe("Quiz");
    expect(json.components[0]?.props_schema).toBeDefined();
    expect(json.components[0]?.events).toEqual({});
  });
});
