import { z } from "zod";

export const LessonMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  objectives: z.array(z.string().min(1)).min(1),
  prereqs: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  est_minutes: z.number().int().positive(),
  language: z.string().default("zh-CN"),
  version: z.string().default("0.1.0"),
  authors: z.array(z.object({ name: z.string().min(1), email: z.email().optional() })).default([]),
  agent_hints: z
    .object({
      teaching_style: z.enum(["socratic", "direct", "example_first"]).optional(),
      suggested_flow: z.array(z.string()).optional(),
      key_moments: z.array(z.string()).optional(),
    })
    .optional(),
});
export type LessonMeta = z.infer<typeof LessonMetaSchema>;
