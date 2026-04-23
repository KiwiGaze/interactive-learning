import { describe, expect, it } from "vitest";
import { QuizEventSchemas, QuizPropsSchema } from "../src/components/quiz.js";

describe("Quiz schema", () => {
  it("accepts a well-formed quiz", () => {
    expect(() =>
      QuizPropsSchema.parse({
        questions: [{ id: "q1", kind: "single_choice", prompt: "x" }],
      }),
    ).not.toThrow();
  });

  it("rejects unknown kind", () => {
    expect(() =>
      QuizPropsSchema.parse({
        questions: [{ id: "q1", kind: "hot_take", prompt: "x" }],
      }),
    ).toThrow();
  });

  it("event schema validates payload shape", () => {
    expect(() =>
      QuizEventSchemas["quiz.answer_submitted"].parse({
        question_id: "q1",
        value: "b",
      }),
    ).not.toThrow();
  });
});
