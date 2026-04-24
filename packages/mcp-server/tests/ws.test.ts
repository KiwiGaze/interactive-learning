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
    const events = before === "" ? store.eventsAfter(undefined) : store.eventsAfter(before);
    expect(events.some((e) => e.type === "quiz.answer_submitted")).toBe(true);
    ws.close();
    await new Promise((r) => ws.on("close", r));
  });

  it("ignores inbound events with missing slot_id", async () => {
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
    ws.send(JSON.stringify({ kind: "event", slot_version: 1, type: "x", payload: {} }));
    await new Promise((r) => setTimeout(r, 50));
    expect(store.currentCursor()).toBe(before);
    ws.close();
    await new Promise((r) => ws.on("close", r));
  });

  it("ignores inbound events with non-number slot_version", async () => {
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
        slot_version: "1",
        type: "x",
        payload: {},
      }),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(store.currentCursor()).toBe(before);
    ws.close();
    await new Promise((r) => ws.on("close", r));
  });

  it("ignores inbound events with reserved payload keys", async () => {
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
      '{"kind":"event","slot_id":"s1","slot_version":1,"type":"x","payload":{"constructor":{"polluted":true}}}',
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(store.currentCursor()).toBe(before);
    ws.close();
    await new Promise((r) => ws.on("close", r));
  });

  it("replays missed events from a since cursor", async () => {
    const { http, port } = await listen();
    const store = new SessionStore();
    const first = store.recordEvent({ slot_id: "s1", slot_version: 1, type: "first", payload: {} });
    store.recordEvent({ slot_id: "s1", slot_version: 1, type: "second", payload: {} });
    attachWebSocket(http, store, { allowedOrigins: [`http://127.0.0.1:${port}`] });
    cleanup.push(
      () =>
        new Promise<void>((resolve) => {
          http.close(() => resolve());
        }),
    );
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?since=${first.event_id}`, {
      headers: { Origin: `http://127.0.0.1:${port}` },
    });
    const msgP = new Promise<string>((r) => ws.on("message", (d) => r(d.toString())));
    await new Promise((r) => ws.on("open", r));
    const msg = JSON.parse(await msgP) as { event: { type: string } };
    expect(msg.event.type).toBe("second");
    ws.close();
    await new Promise((r) => ws.on("close", r));
  });

  it("closes reconnects with expired since cursor", async () => {
    const { http, port } = await listen();
    const store = new SessionStore();
    attachWebSocket(http, store, { allowedOrigins: [`http://127.0.0.1:${port}`] });
    cleanup.push(
      () =>
        new Promise<void>((resolve) => {
          http.close(() => resolve());
        }),
    );
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?since=stale`, {
      headers: { Origin: `http://127.0.0.1:${port}` },
    });
    const close = await new Promise<{ code: number; reason: string }>((resolve) => {
      ws.on("close", (code, reason) => resolve({ code, reason: reason.toString() }));
    });
    expect(close).toEqual({ code: 1008, reason: "CURSOR_EXPIRED" });
  });
});
