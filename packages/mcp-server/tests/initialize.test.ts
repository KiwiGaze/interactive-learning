import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server.js";

describe("MCP server initialize", () => {
  it("responds to initialize with server info", async () => {
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    const { server } = buildServer();
    await server.connect(serverT);

    const client = new Client({ name: "test", version: "0" });
    await client.connect(clientT);

    const info = client.getServerVersion();
    expect(info?.name).toBe("interactive-learning");
  });
});
