import { UpdateComponentInputSchema } from "@interactive-learning/protocol";
import type { Operation } from "fast-json-patch";
import type { z as Z } from "zod";
import type { CatalogRegistry } from "../catalog.js";
import { toJsonRpcError } from "../errors.js";
import type { SessionStore } from "../session-store.js";

export async function updateComponentHandler(deps: {
  store: SessionStore;
  catalog: CatalogRegistry;
  input: Z.input<typeof UpdateComponentInputSchema>;
}): Promise<{ cursor: string }> {
  const { store, catalog } = deps;
  const parsed = UpdateComponentInputSchema.parse(deps.input);
  const slot = store.getSlot(parsed.slot_id);
  if (!slot) throw toJsonRpcError(new Error(`NOT_FOUND: ${parsed.slot_id}`));

  try {
    // JsonPatchOp and fast-json-patch's Operation are structurally compatible at runtime;
    // the discriminated-union type requires a cast here.
    const res = store.update(
      { slot_id: parsed.slot_id, patch: parsed.patch as ReadonlyArray<Operation> },
      (type, next) => catalog.validateProps(type, next),
    );
    return { cursor: res.cursor };
  } catch (cause) {
    throw toJsonRpcError(cause, { component: slot.type, slot_id: parsed.slot_id });
  }
}
