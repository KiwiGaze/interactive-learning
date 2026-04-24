import { SlotRenderer } from "./components/SlotRenderer.js";
import { useSessionStore } from "./state/session-store.js";

export function SessionRoot() {
  const slots = useSessionStore((s) => s.slots);
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      {slots.length === 0 ? (
        <div className="rounded border border-border bg-muted p-6 text-sm text-muted-foreground">
          Waiting for the lesson to start...
        </div>
      ) : (
        slots.map((s) => (
          <section key={s.slot_id} data-slot-id={s.slot_id} data-slot-version={s.version}>
            <SlotRenderer key={`${s.slot_id}:${s.version}`} slot={s} />
          </section>
        ))
      )}
    </main>
  );
}
