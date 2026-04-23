import { z } from "zod";

export const SlotStateSchema = z.object({
  slot_id: z.string().min(1),
  version: z.number().int().nonnegative(),
  parent_slot: z.string().optional(),
  type: z.string().min(1),
  props: z.unknown(),
  children: z.array(z.string()).optional(),
});
export type SlotState = z.infer<typeof SlotStateSchema>;

export const SessionSnapshotSchema = z.object({
  id: z.string().min(1),
  started_at: z.number().int().nonnegative(),
  cursor: z.string(),
  browser_connected: z.boolean(),
  last_agent_tool_call: z.number().int().nonnegative(),
  slots: z.array(SlotStateSchema),
  recent_events: z.array(
    z.object({
      event_id: z.string(),
      timestamp: z.number(),
      slot_id: z.string(),
      slot_version: z.number(),
      type: z.string(),
      payload: z.unknown(),
    }),
  ),
});
export type SessionSnapshot = z.infer<typeof SessionSnapshotSchema>;
