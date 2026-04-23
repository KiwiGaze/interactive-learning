import { z } from "zod";
import { EventEnvelopeSchema } from "./events.js";

export const JsonPatchOpSchema = z.object({
  op: z.enum(["add", "remove", "replace", "move", "copy", "test"]),
  path: z.string().startsWith("/"),
  value: z.unknown().optional(),
  from: z.string().startsWith("/").optional(),
});
export type JsonPatchOp = z.infer<typeof JsonPatchOpSchema>;

export const RenderComponentInputSchema = z.object({
  slot_id: z.string().min(1).optional(),
  type: z.string().min(1),
  props: z.unknown(),
  replace: z.boolean().optional(),
});
export type RenderComponentInput = z.infer<typeof RenderComponentInputSchema>;

export const RenderComponentOutputSchema = z.object({
  slot_id: z.string(),
  cursor: z.string(),
});
export type RenderComponentOutput = z.infer<typeof RenderComponentOutputSchema>;

export const UpdateComponentInputSchema = z.object({
  slot_id: z.string().min(1),
  patch: z.array(JsonPatchOpSchema).min(1),
});
export type UpdateComponentInput = z.infer<typeof UpdateComponentInputSchema>;

export const UpdateComponentOutputSchema = z.object({ cursor: z.string() });
export type UpdateComponentOutput = z.infer<typeof UpdateComponentOutputSchema>;

export const WaitForEventInputSchema = z.object({
  since_cursor: z.string().optional(),
  timeout_ms: z.number().int().min(0).max(30_000).default(25_000),
});
export type WaitForEventInput = z.infer<typeof WaitForEventInputSchema>;

export const WaitForEventOutputSchema = z.object({
  events: z.array(EventEnvelopeSchema),
  next_cursor: z.string(),
});
export type WaitForEventOutput = z.infer<typeof WaitForEventOutputSchema>;

export const EndSessionInputSchema = z.object({
  reason: z.string().optional(),
});
export type EndSessionInput = z.infer<typeof EndSessionInputSchema>;
