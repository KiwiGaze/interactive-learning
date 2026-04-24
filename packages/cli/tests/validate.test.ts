import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateLesson } from "../src/validate.js";

async function writeBasePack(dir: string): Promise<void> {
  await fs.writeFile(
    path.join(dir, "meta.mjs"),
    `export default { id: "x", title: "X", summary: "s", objectives: ["a"], est_minutes: 5 };`,
  );
  await fs.writeFile(path.join(dir, "index.mdx"), '# Hello\n\n<Hint content="Try it" />');
}

describe("validateLesson", () => {
  it("passes a minimal well-formed pack", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await writeBasePack(dir);
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

  it("requires an interactive component in index.mdx", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(
      path.join(dir, "meta.mjs"),
      `export default { id: "x", title: "X", summary: "s", objectives: ["a"], est_minutes: 5 };`,
    );
    await fs.writeFile(path.join(dir, "index.mdx"), "# Hi");

    const result = await validateLesson(dir);

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.message.includes("interactive component"))).toBe(
      true,
    );
  });

  it("validates quiz.yaml against Quiz props schema", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await writeBasePack(dir);
    await fs.writeFile(
      path.join(dir, "quiz.yaml"),
      [
        "questions:",
        "  - id: q1",
        "    kind: unsupported",
        "    prompt: Pick one",
        "    options: []",
      ].join("\n"),
    );

    const result = await validateLesson(dir);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "yaml",
          path: ["quiz.yaml", "questions", 0, "kind"],
        }),
      ]),
    );
  });

  it("validates flashcards.yaml against FlashCard props schema", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await writeBasePack(dir);
    await fs.writeFile(
      path.join(dir, "flashcards.yaml"),
      ["cards:", "  - id: c1", "    front: Front", "    back: Back"].join("\n"),
    );

    const result = await validateLesson(dir);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "yaml",
          path: ["flashcards.yaml", "deck_id"],
        }),
      ]),
    );
  });
});
