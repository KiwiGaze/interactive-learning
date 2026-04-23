import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ensureSafeAssetPath, readLessonMeta } from "../src/course-pack.js";

describe("course pack loader", () => {
  it("reads and validates meta.mjs via dynamic import", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(
      path.join(tmp, "meta.mjs"),
      `export default { id: "x", title: "X", summary: "s", objectives: ["a"], est_minutes: 5 };`,
    );
    const meta = await readLessonMeta(tmp, "meta.mjs");
    expect(meta.id).toBe("x");
  });

  it("rejects asset paths outside lesson dir (no ..)", () => {
    expect(() => ensureSafeAssetPath("/home/u/courses/py", "../../etc/passwd")).toThrow();
    expect(() => ensureSafeAssetPath("/home/u/courses/py", "assets/ok.png")).not.toThrow();
  });
});
