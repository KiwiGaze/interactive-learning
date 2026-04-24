import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerDefaultCatalog } from "../src/catalog-bindings.js";
import { CatalogRegistry } from "../src/catalog.js";
import { type SessionToolName, buildServer } from "../src/server.js";
import { SessionStore } from "../src/session-store.js";

async function connectServer(options: {
  store: SessionStore;
  catalog: CatalogRegistry;
  beforeToolCall?: (toolName: SessionToolName) => Promise<void>;
}): Promise<Client> {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const { server } = buildServer(options);
  await server.connect(serverTransport);

  const client = new Client({ name: "test", version: "0" });
  await client.connect(clientTransport);
  return client;
}

function quizProps(): Record<string, unknown> {
  return {
    questions: [
      {
        id: "q1",
        kind: "single_choice",
        prompt: "Pick one",
        options: [{ id: "a", label: "A" }],
      },
    ],
  };
}

function textContent(response: Awaited<ReturnType<Client["callTool"]>>): string {
  return (response.content as Array<{ type: string; text: string }>)[0]?.text ?? "{}";
}

describe("MCP server tool hooks", () => {
  const clients: Client[] = [];

  afterEach(async () => {
    for (const client of clients.splice(0)) await client.close();
  });

  it("runs beforeToolCall before render_component mutates session state", async () => {
    const store = new SessionStore();
    const catalog = new CatalogRegistry();
    registerDefaultCatalog(catalog);
    const beforeToolCall = vi.fn(async () => {
      throw new Error("HTTP startup failed");
    });
    const client = await connectServer({ store, catalog, beforeToolCall });
    clients.push(client);

    await expect(
      client.callTool({
        name: "render_component",
        arguments: { type: "Quiz", props: quizProps() },
      }),
    ).rejects.toBeDefined();

    expect(beforeToolCall).toHaveBeenCalledWith("render_component");
    expect(store.listSlots()).toHaveLength(0);
    expect(store.eventCount()).toBe(0);
  });

  it("runs beforeToolCall for every session tool", async () => {
    const store = new SessionStore();
    const catalog = new CatalogRegistry();
    registerDefaultCatalog(catalog);
    const toolNames: SessionToolName[] = [];
    const client = await connectServer({
      store,
      catalog,
      beforeToolCall: async (toolName) => {
        toolNames.push(toolName);
      },
    });
    clients.push(client);

    const renderResponse = await client.callTool({
      name: "render_component",
      arguments: { type: "Quiz", props: quizProps() },
    });
    const rendered = JSON.parse(textContent(renderResponse)) as { slot_id: string };

    await client.callTool({
      name: "update_component",
      arguments: {
        slot_id: rendered.slot_id,
        patch: [{ op: "add", path: "/title", value: "Updated" }],
      },
    });
    await client.callTool({ name: "wait_for_event", arguments: { timeout_ms: 0 } });
    await client.callTool({ name: "end_session", arguments: {} });

    expect(toolNames).toEqual([
      "render_component",
      "update_component",
      "wait_for_event",
      "end_session",
    ]);
  });
});
