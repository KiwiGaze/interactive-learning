import { RenderComponentInputSchema } from "@interactive-learning/protocol";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { CatalogRegistry } from "./catalog.js";
import { SessionStore } from "./session-store.js";
import { renderComponentHandler } from "./tools/render-component.js";

export interface BuildServerOptions {
  store?: SessionStore;
  catalog?: CatalogRegistry;
}

export function buildServer(opts: BuildServerOptions = {}): {
  server: Server;
  store: SessionStore;
  catalog: CatalogRegistry;
} {
  const store = opts.store ?? new SessionStore();
  const catalog = opts.catalog ?? new CatalogRegistry();
  const server = new Server(
    { name: "interactive-learning", version: "0.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "render_component",
        description: "Render a semantic component in a slot (new, replace, or reject duplicate).",
        inputSchema: z.toJSONSchema(RenderComponentInputSchema),
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    switch (req.params.name) {
      case "render_component": {
        const out = await renderComponentHandler({
          store,
          catalog,
          input: (req.params.arguments ?? {}) as z.input<typeof RenderComponentInputSchema>,
        });
        return { content: [{ type: "text", text: JSON.stringify(out) }] };
      }
      default:
        throw new Error(`UNKNOWN_TOOL: ${req.params.name}`);
    }
  });

  return { server, store, catalog };
}
