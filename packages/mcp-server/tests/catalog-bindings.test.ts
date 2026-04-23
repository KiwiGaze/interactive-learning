import { describe, expect, it } from "vitest";
import { registerDefaultCatalog } from "../src/catalog-bindings.js";
import { CatalogRegistry } from "../src/catalog.js";

describe("registerDefaultCatalog", () => {
  it("registers all 6 default component types", () => {
    const reg = new CatalogRegistry();
    registerDefaultCatalog(reg);
    const types = reg
      .list()
      .map((d) => d.type)
      .sort();
    expect(types).toEqual(["Diagram", "FlashCard", "Hint", "Markdown", "Quiz", "StepByStep"]);
  });
});
