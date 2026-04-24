import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toJsonRpcError } from "../src/errors.js";

describe("toJsonRpcError", () => {
  it("maps ZodError to MCP InvalidParams with path + expected + received", () => {
    const schema = z.object({ kind: z.enum(["a", "b"]) });
    try {
      schema.parse({ kind: "c" });
      throw new Error("should have thrown");
    } catch (e) {
      const err = toJsonRpcError(e, { component: "Quiz" });
      expect(err.code).toBe(-32602);
      expect(err.data.component).toBe("Quiz");
      const issues = err.data.issues as Array<{
        path: ReadonlyArray<string | number>;
        expected: string;
      }>;
      expect(issues[0]?.path).toEqual(["kind"]);
      expect(issues[0]?.expected).toBeDefined();
    }
  });

  it("preserves domain codes like UNKNOWN_COMPONENT", () => {
    const domain = new Error("UNKNOWN_COMPONENT: Quiz") as Error & { code?: string };
    domain.code = "UNKNOWN_COMPONENT";
    const err = toJsonRpcError(domain);
    expect(err.code).toBe(-32602);
    expect(err.data.reason).toBe("UNKNOWN_COMPONENT");
  });

  it("returns a new error object when preserving domain codes", () => {
    const domain = new Error("CURSOR_EXPIRED: stale") as Error & { code?: string };
    domain.code = "CURSOR_EXPIRED";
    const err = toJsonRpcError(domain);
    expect(err).not.toBe(domain);
    expect(domain.code).toBe("CURSOR_EXPIRED");
    expect(err.data.reason).toBe("CURSOR_EXPIRED");
  });

  it("wraps unknown (non-Error) throws as internal -32603", () => {
    const err = toJsonRpcError("string error");
    expect(err.code).toBe(-32603);
    expect(err.data.reason).toBe("INTERNAL");
  });
});
