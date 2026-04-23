import { type Server as HttpServer, createServer } from "node:http";
import { EventEnvelopeSchema } from "@interactive-learning/protocol";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { SessionStore } from "../src/session-store.js";
import { attachWebSocket } from "../src/ws.js";

async function listen(): Promise<{ http: HttpServer; port: number }> {
  const http = createServer();
  await new Promise<void>((r) => http.listen(0, "127.0.0.1", r));
  const addr = http.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  return { http, port };
}

describe("WebSocket", () => {
  let cleanup: Array<() => Promise<void>> = [];
  afterEach(async () => {
    for (const c of cleanup) await c();
    cleanup = [];
  });

  it("rejects connections from non-local origins", async () => {
    const { http, port } = await listen();
    const store = new SessionStore();
    attachWebSocket(http, store, { allowedOrigins: [`http://127.0.0.1:${port}`] });
    cleanup.push(
      () =>
        new Promise<void>((resolve) => {
          http.close(() => resolve());
        }),
    );
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
      headers: { Origin: "http://evil.com" },
    });
    await new Promise((r) => ws.on("close", r));
    expect(ws.readyState).toBe(WebSocket.CLOSED);
  });

  it("broadcasts recorded events to connected clients", async () => {
    const { http, port } = await listen();
    const store = new SessionStore();
    attachWebSocket(http, store, { allowedOrigins: [`http://127.0.0.1:${port}`] });
    cleanup.push(
      () =>
        new Promise<void>((resolve) => {
          http.close(() => resolve());
        }),
    );
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
      headers: { Origin: `http://127.0.0.1:${port}` },
    });
    await new Promise((r) => ws.on("open", r));
    const msgP = new Promise<string>((r) => ws.on("message", (d) => r(d.toString())));
    store.recordEvent({ slot_id: "s1", slot_version: 1, type: "quiz.x", payload: {} });
    const msg = JSON.parse(await msgP) as { kind: string; event: unknown };
    expect(msg.kind).toBe("event");
    expect(() => EventEnvelopeSchema.parse(msg.event)).not.toThrow();
    ws.close();
    await new Promise((r) => ws.on("close", r));
  });

  it("forwards inbound client events into SessionStore", async () => {
    const { http, port } = await listen();
    const store = new SessionStore();
    attachWebSocket(http, store, { allowedOrigins: [`http://127.0.0.1:${port}`] });
    cleanup.push(
      () =>
        new Promise<void>((resolve) => {
          http.close(() => resolve());
        }),
    );
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
      headers: { Origin: `http://127.0.0.1:${port}` },
    });
    await new Promise((r) => ws.on("open", r));
    const before = store.currentCursor();
    ws.send(
      JSON.stringify({
        kind: "event",
        slot_id: "s1",
        slot_version: 1,
        type: "quiz.answer_submitted",
        payload: { question_id: "q1", value: "b" },
      }),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(store.eventsAfter(before).some((e) => e.type === "quiz.answer_submitted")).toBe(true);
    ws.close();
    await new Promise((r) => ws.on("close", r));
  });
});
