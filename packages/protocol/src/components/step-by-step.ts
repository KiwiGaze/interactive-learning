import { z } from "zod";

export const StepByStepPropsSchema = z.object({
  title: z.string().optional(),
  steps: z.array(
    z.object({
      id: z.string(),
      heading: z.string(),
      content: z.string(),
      initially_open: z.boolean().default(false),
      required: z.boolean().default(false),
    }),
  ),
  navigation: z.enum(["free", "sequential"]).default("free"),
});
export type StepByStepProps = z.infer<typeof StepByStepPropsSchema>;

export const StepByStepEventSchemas = {
  "step.expanded": z.object({ step_id: z.string() }),
  "step.collapsed": z.object({ step_id: z.string() }),
  "step.marked_done": z.object({ step_id: z.string() }),
} as const;
