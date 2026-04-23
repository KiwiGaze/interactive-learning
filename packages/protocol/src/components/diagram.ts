import { z } from "zod";

export const DiagramPropsSchema = z.object({
  source: z.string(),
  caption: z.string().optional(),
  allow_zoom: z.boolean().default(true),
  allow_download: z.boolean().default(false),
});
export type DiagramProps = z.infer<typeof DiagramPropsSchema>;

export const DiagramEventSchemas = {
  "diagram.node_clicked": z.object({ node_id: z.string() }),
  "diagram.rendered": z.object({
    nodes: z.number().int().nonnegative(),
    edges: z.number().int().nonnegative(),
  }),
} as const;
