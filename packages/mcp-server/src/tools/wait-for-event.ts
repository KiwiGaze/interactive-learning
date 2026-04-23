import { type EventEnvelope, WaitForEventInputSchema } from "@interactive-learning/protocol";
import type { z as Z } from "zod";
import type { SessionStore } from "../session-store.js";

function sliceOrThrow(store: SessionStore, since: string | undefined): readonly EventEnvelope[] {
  // Let CURSOR_EXPIRED bubble through as-is so agents can distinguish it and
  // reconcile via session://current/state. Full JSON-RPC mapping lives in S.16.
  return store.eventsAfter(since);
}

export async function waitForEventHandler(deps: {
  store: SessionStore;
  input: Z.input<typeof WaitForEventInputSchema>;
}): Promise<{ events: readonly EventEnvelope[]; next_cursor: string }> {
  const { store } = deps;
  const parsed = WaitForEventInputSchema.parse(deps.input);
  const { since_cursor, timeout_ms } = parsed;

  const immediate = sliceOrThrow(store, since_cursor);
  if (immediate.length > 0) {
    const last = immediate.at(-1);
    if (!last) throw new Error("unreachable: non-empty slice has a last element");
    return { events: immediate, next_cursor: last.event_id };
  }

  return await new Promise<{ events: readonly EventEnvelope[]; next_cursor: string }>(
    (resolve, reject) => {
      const timer = setTimeout(() => {
        unsub();
        resolve({ events: [], next_cursor: since_cursor ?? store.currentCursor() });
      }, timeout_ms);
      const unsub = store.onEvent(() => {
        try {
          const slice = sliceOrThrow(store, since_cursor);
          if (slice.length > 0) {
            clearTimeout(timer);
            unsub();
            const last = slice.at(-1);
            if (!last) return;
            resolve({ events: slice, next_cursor: last.event_id });
          }
        } catch (err) {
          clearTimeout(timer);
          unsub();
          reject(err);
        }
      });
    },
  );
}
