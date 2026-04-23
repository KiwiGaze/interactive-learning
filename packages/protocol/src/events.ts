import { z } from "zod";

export const RESERVED_EVENT_PREFIXES = ["component.", "session."] as const;

export const EventEnvelopeSchema = z.object({
  event_id: z.uuid(),
  timestamp: z.number().int().nonnegative(),
  slot_id: z.string().min(1),
  slot_version: z.number().int().nonnegative(),
  type: z.string().min(1),
  payload: z.unknown(),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
