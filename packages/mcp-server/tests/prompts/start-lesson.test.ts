import { describe, expect, it } from "vitest";
import { START_LESSON_PROMPT, startLessonPrompt } from "../../src/prompts/start-lesson.js";

describe("/start_lesson prompt", () => {
  it("references meta.ts, index.mdx, and catalog", () => {
    const out = startLessonPrompt({ path: "~/courses/decorators" });
    const first = out.messages[0];
    expect(first).toBeDefined();
    expect(first?.content.text).toMatch(/meta\.ts/);
    expect(first?.content.text).toMatch(/index\.mdx/);
    expect(first?.content.text).toMatch(/catalog:\/\/components/);
    expect(first?.content.text).toMatch(/~\/courses\/decorators/);
  });

  it("exposes the literal prompt name for registration", () => {
    expect(START_LESSON_PROMPT.name).toBe("start_lesson");
  });
});
