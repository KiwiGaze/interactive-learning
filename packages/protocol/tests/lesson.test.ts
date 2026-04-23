import { describe, expect, it } from "vitest";
import { LessonMetaSchema } from "../src/lesson.js";

describe("LessonMetaSchema", () => {
  it("requires id, title, summary, objectives≥1, est_minutes", () => {
    expect(() =>
      LessonMetaSchema.parse({
        id: "py-decorators",
        title: "Python Decorators",
        summary: "Learn @decorator syntax",
        objectives: ["Explain recursion", "Use @staticmethod"],
        est_minutes: 30,
      }),
    ).not.toThrow();
  });

  it("rejects empty objectives", () => {
    expect(() =>
      LessonMetaSchema.parse({
        id: "x",
        title: "x",
        summary: "x",
        objectives: [],
        est_minutes: 5,
      }),
    ).toThrow();
  });
});
