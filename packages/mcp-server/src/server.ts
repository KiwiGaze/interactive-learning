import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function buildServer(): Server {
  const server = new Server(
    { name: "interactive-learning", version: "0.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } },
  );
  return server;
}
