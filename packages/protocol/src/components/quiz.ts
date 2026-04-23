import { z } from "zod";

export const QuizPropsSchema = z.object({
  title: z.string().optional(),
  questions: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["single_choice", "multi_choice", "short_answer"]),
      prompt: z.string(),
      options: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            is_correct: z.boolean().optional(),
          }),
        )
        .optional(),
      correct_answer: z.union([z.string(), z.array(z.string())]).optional(),
      explanation: z.string().optional(),
    }),
  ),
  reveal_mode: z.enum(["immediate", "on_submit", "never"]).default("on_submit"),
  allow_retry: z.boolean().default(true),
});
export type QuizProps = z.infer<typeof QuizPropsSchema>;

export const QuizEventSchemas = {
  "quiz.answer_submitted": z.object({ question_id: z.string(), value: z.unknown() }),
  "quiz.all_submitted": z.object({ answers: z.record(z.string(), z.unknown()) }),
  "quiz.explanation_shown": z.object({ question_id: z.string() }),
} as const;
