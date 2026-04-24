import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const SERVER_BIN = path.resolve(here, "..", "..", "mcp-server", "bin", "server.js");

export interface E2eServer {
  client: Client;
  close: () => Promise<void>;
}

export async function startServer(): Promise<E2eServer> {
  const transport = new StdioClientTransport({ command: "node", args: [SERVER_BIN] });
  const client = new Client({ name: "e2e", version: "0" });
  await client.connect(transport);
  return { client, close: async () => client.close() };
}

export async function renderComponent(
  client: Client,
  type: string,
  props: Record<string, unknown>,
): Promise<{ slot_id: string; cursor: string }> {
  const response = await client.callTool({ name: "render_component", arguments: { type, props } });
  const text = (response.content as Array<{ type: string; text: string }>)[0]?.text ?? "{}";
  return JSON.parse(text) as { slot_id: string; cursor: string };
}

export async function waitForEvents(
  client: Client,
  sinceCursor: string,
): Promise<Array<{ type: string; slot_version: number }>> {
  const response = await client.callTool({
    name: "wait_for_event",
    arguments: { since_cursor: sinceCursor, timeout_ms: 5000 },
  });
  const text = (response.content as Array<{ type: string; text: string }>)[0]?.text ?? "{}";
  return (JSON.parse(text) as { events: Array<{ type: string; slot_version: number }> }).events;
}
