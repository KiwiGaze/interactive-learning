import {
  EndSessionInputSchema,
  RenderComponentInputSchema,
  UpdateComponentInputSchema,
  WaitForEventInputSchema,
} from "@interactive-learning/protocol";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { CatalogRegistry } from "./catalog.js";
import { START_LESSON_PROMPT, startLessonPrompt } from "./prompts/start-lesson.js";
import { readCatalogResource } from "./resources/catalog.js";
import { readSessionStateResource } from "./resources/session-state.js";
import { SessionStore } from "./session-store.js";
import { endSessionHandler } from "./tools/end-session.js";
import { renderComponentHandler } from "./tools/render-component.js";
import { updateComponentHandler } from "./tools/update-component.js";
import { waitForEventHandler } from "./tools/wait-for-event.js";

export interface BuildServerOptions {
  store?: SessionStore;
  catalog?: CatalogRegistry;
  onRenderComponent?: () => Promise<void>;
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
      {
        name: "update_component",
        description: "Apply RFC 6902 JSON Patch to an existing slot's props.",
        inputSchema: z.toJSONSchema(UpdateComponentInputSchema),
      },
      {
        name: "wait_for_event",
        description: "Long-poll for events accumulated after since_cursor (max 30s).",
        inputSchema: z.toJSONSchema(WaitForEventInputSchema),
      },
      {
        name: "end_session",
        description: "Signal that the session is ending.",
        inputSchema: z.toJSONSchema(EndSessionInputSchema),
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
        await opts.onRenderComponent?.();
        return { content: [{ type: "text", text: JSON.stringify(out) }] };
      }
      case "update_component": {
        const out = await updateComponentHandler({
          store,
          catalog,
          input: (req.params.arguments ?? {}) as z.input<typeof UpdateComponentInputSchema>,
        });
        return { content: [{ type: "text", text: JSON.stringify(out) }] };
      }
      case "wait_for_event": {
        const out = await waitForEventHandler({
          store,
          input: (req.params.arguments ?? {}) as z.input<typeof WaitForEventInputSchema>,
        });
        return { content: [{ type: "text", text: JSON.stringify(out) }] };
      }
      case "end_session": {
        const out = await endSessionHandler({
          store,
          input: (req.params.arguments ?? {}) as z.input<typeof EndSessionInputSchema>,
        });
        return { content: [{ type: "text", text: JSON.stringify(out) }] };
      }
      default:
        throw new Error(`UNKNOWN_TOOL: ${req.params.name}`);
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      { uri: "catalog://components", name: "Component catalog", mimeType: "application/json" },
      {
        uri: "session://current/state",
        name: "Current session snapshot",
        mimeType: "application/json",
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    switch (req.params.uri) {
      case "catalog://components":
        return readCatalogResource({ catalog });
      case "session://current/state":
        return readSessionStateResource({ store });
      default:
        throw new Error(`UNKNOWN_RESOURCE: ${req.params.uri}`);
    }
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [START_LESSON_PROMPT],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (req) => {
    if (req.params.name !== "start_lesson") throw new Error("UNKNOWN_PROMPT");
    const path = String(req.params.arguments?.path ?? "");
    if (!path) throw new Error("MISSING_ARG: path");
    return startLessonPrompt({ path });
  });

  return { server, store, catalog };
}
