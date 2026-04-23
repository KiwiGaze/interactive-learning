import { EndSessionInputSchema } from "@interactive-learning/protocol";
import type { z as Z } from "zod";
import type { SessionStore } from "../session-store.js";

export async function endSessionHandler(deps: {
  store: SessionStore;
  input: Z.input<typeof EndSessionInputSchema>;
}): Promise<Record<string, never>> {
  const parsed = EndSessionInputSchema.parse(deps.input);
  deps.store.recordEvent({
    slot_id: "__session__",
    slot_version: 0,
    type: "session.ended",
    payload: { reason: parsed.reason ?? "" },
  });
  return {};
}
