import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildSkills } from "../src/build.js";

describe("buildSkills", () => {
  it("emits claude-code SKILL.md with frontmatter", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "il-skills-"));
    await fs.mkdir(path.join(tmp, "src"), { recursive: true });
    await fs.writeFile(
      path.join(tmp, "src/skill.md"),
      "# Interactive Learning\n\n## Consumer loop\n\n...",
    );
    await buildSkills(tmp);
    const body = await fs.readFile(
      path.join(tmp, "dist/claude-code/interactive-learning/SKILL.md"),
      "utf8",
    );
    expect(body).toMatch(/^---\nname: interactive-learning/);
    expect(body).toMatch(/Consumer loop/);
  });

  it("package metadata exposes generated skill output", async () => {
    const raw = await fs.readFile(path.resolve(process.cwd(), "package.json"), "utf8");
    const packageJson = JSON.parse(raw) as { files?: string[]; exports?: Record<string, string> };

    expect(packageJson.files).toEqual(["dist", "src/skill.md"]);
    expect(packageJson.exports?.["."]).toBe("./dist/claude-code/interactive-learning/SKILL.md");
  });

  it("documents protocol quiz event names", async () => {
    const body = await fs.readFile(path.resolve(process.cwd(), "src/skill.md"), "utf8");

    expect(body).toContain("quiz.answer_submitted");
    expect(body).toContain("quiz.all_submitted");
    expect(body).not.toContain("quiz_answer");
  });

  it("documents the real lesson startup flow", async () => {
    const body = await fs.readFile(path.resolve(process.cwd(), "src/skill.md"), "utf8");

    expect(body).not.toContain("Call `start_lesson` with the lesson id");
    expect(body).toContain("MCP prompt `start_lesson`");
    expect(body).toContain("meta.mjs` or `meta.ts");
    expect(body).toContain("index.mdx");
    expect(body).toContain("YAML side-cars");
    expect(body).toContain("update_component");
  });
});
