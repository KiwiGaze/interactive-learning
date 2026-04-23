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
});
