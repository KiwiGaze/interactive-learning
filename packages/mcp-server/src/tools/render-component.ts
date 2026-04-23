import { RenderComponentInputSchema } from "@interactive-learning/protocol";
import type { z as Z } from "zod";
import type { CatalogRegistry } from "../catalog.js";
import { toJsonRpcError } from "../errors.js";
import type { SessionStore } from "../session-store.js";

export async function renderComponentHandler(deps: {
  store: SessionStore;
  catalog: CatalogRegistry;
  input: Z.input<typeof RenderComponentInputSchema>;
}): Promise<{ slot_id: string; cursor: string }> {
  const { store, catalog } = deps;
  const parsed = RenderComponentInputSchema.parse(deps.input);
  const validatedProps = (() => {
    try {
      return catalog.validateProps(parsed.type, parsed.props);
    } catch (cause) {
      throw toJsonRpcError(cause, { component: parsed.type });
    }
  })();
  try {
    const args: Parameters<SessionStore["render"]>[0] = {
      type: parsed.type,
      props: validatedProps,
    };
    if (parsed.slot_id !== undefined) args.slot_id = parsed.slot_id;
    if (parsed.replace !== undefined) args.replace = parsed.replace;
    return store.render(args);
  } catch (cause) {
    throw toJsonRpcError(cause);
  }
}
