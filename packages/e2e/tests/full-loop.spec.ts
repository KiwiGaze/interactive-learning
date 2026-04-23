import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { expect, test } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const SERVER_BIN = path.resolve(here, "..", "..", "mcp-server", "bin", "server.js");

test("agent renders Quiz, user submits, agent receives quiz.all_submitted", async ({ page }) => {
  const transport = new StdioClientTransport({ command: "node", args: [SERVER_BIN] });
  const client = new Client({ name: "e2e", version: "0" });
  await client.connect(transport);

  const renderResp = await client.callTool({
    name: "render_component",
    arguments: {
      type: "Quiz",
      props: {
        questions: [
          {
            id: "q1",
            kind: "single_choice",
            prompt: "Pick B",
            options: [
              { id: "a", label: "A", is_correct: false },
              { id: "b", label: "B", is_correct: true },
            ],
          },
        ],
        reveal_mode: "on_submit",
        allow_retry: true,
      },
    },
  });
  const renderText = (renderResp.content as Array<{ type: string; text: string }>)[0]?.text ?? "{}";
  const rendered = JSON.parse(renderText) as { slot_id: string; cursor: string };

  await page.goto("http://127.0.0.1:7654/");
  await page.getByLabel("B").click();
  await page.getByRole("button", { name: /submit/i }).click();

  const waitResp = await client.callTool({
    name: "wait_for_event",
    arguments: { since_cursor: rendered.cursor, timeout_ms: 5000 },
  });
  const waitText = (waitResp.content as Array<{ type: string; text: string }>)[0]?.text ?? "{}";
  const events = JSON.parse(waitText) as { events: Array<{ type: string }> };

  expect(events.events.map((e) => e.type)).toContain("quiz.all_submitted");

  await client.close();
});
