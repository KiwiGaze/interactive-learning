import type { z } from "zod";

export function requireOwnKeys<Shape extends z.ZodRawShape>(
  schema: z.ZodObject<Shape>,
  keys: readonly (keyof Shape & string)[],
): z.ZodObject<Shape> {
  return schema.superRefine((value, ctx) => {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) continue;
      ctx.addIssue({
        code: "custom",
        path: [key],
        message: "Required",
      });
    }
  });
}
