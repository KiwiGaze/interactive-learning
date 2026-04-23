import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CatalogRegistry } from "../../src/catalog.js";
import { readCatalogResource } from "../../src/resources/catalog.js";

describe("catalog://components", () => {
  it("returns JSON Schema for all registered components", async () => {
    const reg = new CatalogRegistry();
    reg.register({ type: "Quiz", props: z.object({ title: z.string() }), events: {} });
    const out = await readCatalogResource({ catalog: reg });
    const first = out.contents[0];
    expect(first).toBeDefined();
    const body = JSON.parse(first?.text ?? "{}") as { components: Array<{ type: string }> };
    expect(body.components[0]?.type).toBe("Quiz");
  });
});
