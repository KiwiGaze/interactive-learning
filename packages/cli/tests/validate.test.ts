import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateLesson } from "../src/validate.js";

describe("validateLesson", () => {
  it("passes a minimal well-formed pack", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(
      path.join(dir, "meta.mjs"),
      `export default { id: "x", title: "X", summary: "s", objectives: ["a"], est_minutes: 5 };`,
    );
    await fs.writeFile(path.join(dir, "index.mdx"), "# Hello");
    const result = await validateLesson(dir);
    expect(result.ok).toBe(true);
  });

  it("reports meta validation errors with path", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(path.join(dir, "meta.mjs"), `export default { id: "x" };`);
    await fs.writeFile(path.join(dir, "index.mdx"), "# Hi");
    const result = await validateLesson(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path.join(".").includes("objectives"))).toBe(true);
  });
});
