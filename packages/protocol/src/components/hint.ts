import { z } from "zod";

export const HintPropsSchema = z.object({
  label: z.string().default("提示"),
  content: z.string(),
  style: z.enum(["inline", "modal"]).default("inline"),
});
export type HintProps = z.infer<typeof HintPropsSchema>;

export const HintEventSchemas = {
  "hint.revealed": z.object({}),
} as const;
