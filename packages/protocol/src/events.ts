import { z } from "zod";
import { requireOwnKeys } from "./required-fields.js";

export const RESERVED_EVENT_PREFIXES = ["component.", "session."] as const;

export const EventEnvelopeSchema = requireOwnKeys(
  z.object({
    event_id: z.string().uuid(),
    timestamp: z.number().int().nonnegative(),
    slot_id: z.string().min(1),
    slot_version: z.number().int().nonnegative(),
    type: z.string().min(1),
    payload: z.unknown(),
  }),
  ["payload"],
);

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema> & { payload: unknown };
