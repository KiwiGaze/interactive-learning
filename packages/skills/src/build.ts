import fs from "node:fs/promises";
import path from "node:path";

const FRONTMATTER = `---
name: interactive-learning
description: Use when the user wants interactive learning, lessons, or creating/consuming course packs.
---

`;

export async function buildSkills(cwd = process.cwd()): Promise<void> {
  const src = path.resolve(cwd, "src/skill.md");
  const out = path.resolve(cwd, "dist/claude-code/interactive-learning/SKILL.md");
  const body = await fs.readFile(src, "utf8");
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, FRONTMATTER + body, "utf8");
}

const thisUrl = import.meta.url;
const argvUrl = process.argv[1] ? `file://${process.argv[1]}` : "";
if (thisUrl === argvUrl) {
  buildSkills().catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
