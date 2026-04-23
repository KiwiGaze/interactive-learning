import { z } from "zod";

export const MarkdownPropsSchema = z.object({
  content: z.string(),
  id_prefix: z.string().optional(),
});
export type MarkdownProps = z.infer<typeof MarkdownPropsSchema>;

export const MarkdownEventSchemas = {
  "markdown.link_clicked": z.object({ url: z.url() }),
  "markdown.code_copied": z.object({ block_id: z.string() }),
} as const;
