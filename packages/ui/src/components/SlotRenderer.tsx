import type { SlotState } from "@interactive-learning/protocol";
import { UI_CATALOG } from "../catalog/catalog.js";
import { SlotErrorBoundary } from "./ErrorBoundary.js";

export function SlotRenderer({ slot }: { slot: SlotState }) {
  const entry = UI_CATALOG.get(slot.type);
  if (!entry) {
    return (
      <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm">
        Unknown component: <code>{slot.type}</code>
      </div>
    );
  }
  const C = entry.Component;
  return (
    <SlotErrorBoundary
      slotId={slot.slot_id}
      slotVersion={slot.version}
      fallback={(err) => (
        <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm">
          Render error in <code>{slot.type}</code>: {err.message}
        </div>
      )}
    >
      <C slotId={slot.slot_id} slotVersion={slot.version} props={slot.props} />
    </SlotErrorBoundary>
  );
}
