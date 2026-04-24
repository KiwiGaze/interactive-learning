import type { Server as HttpServer } from "node:http";
import { type WebSocket, WebSocketServer } from "ws";
import { z } from "zod";
import type { SessionStore } from "./session-store.js";

export interface WsOptions {
  allowedOrigins: readonly string[];
}

const INBOUND_KIND = "event";

// Policy Violation close code — tells the client the connection was refused
// due to policy, resulting in a clean close frame rather than a socket destroy
// that would cause the ws client to emit an unhandled 'error' event.
const WS_POLICY_VIOLATION = 1008;

const RESERVED_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema).superRefine((value, ctx) => {
      for (const key of Object.keys(value)) {
        if (RESERVED_OBJECT_KEYS.has(key)) {
          ctx.addIssue({
            code: "custom",
            message: `Reserved object key "${key}" is not allowed`,
            path: [key],
          });
        }
      }
    }),
  ]),
);

const InboundEventSchema = z.object({
  kind: z.literal(INBOUND_KIND),
  slot_id: z.string().min(1),
  slot_version: z.number().int().nonnegative(),
  type: z.string().min(1),
  payload: JsonValueSchema,
});

export function attachWebSocket(
  http: HttpServer,
  store: SessionStore,
  opts: WsOptions,
): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true, path: "/ws" });
  // Separate server used only to complete the handshake for rejected origins,
  // so we can send a clean close frame instead of destroying the TCP socket.
  const rejectWss = new WebSocketServer({ noServer: true });

  rejectWss.on("connection", (ws: WebSocket) => {
    ws.close(WS_POLICY_VIOLATION, "Origin not allowed");
  });

  http.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/ws") return;
    const origin = req.headers.origin ?? "";
    if (!opts.allowedOrigins.includes(origin)) {
      rejectWss.handleUpgrade(req, socket, head, (ws) => rejectWss.emit("connection", ws, req));
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  wss.on("connection", (ws: WebSocket, req) => {
    store.browserConnected = true;
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    const since = url.searchParams.get("since") ?? undefined;

    const unsub = store.onEvent((ev) => {
      ws.send(JSON.stringify({ kind: "event", event: ev }));
    });

    try {
      for (const event of store.eventsAfter(since)) {
        ws.send(JSON.stringify({ kind: "event", event }));
      }
    } catch {
      ws.close(WS_POLICY_VIOLATION, "CURSOR_EXPIRED");
      unsub();
      store.browserConnected = false;
      return;
    }

    ws.on("message", (raw) => {
      try {
        const parsed = InboundEventSchema.parse(JSON.parse(raw.toString()));
        store.recordEvent({
          slot_id: parsed.slot_id,
          slot_version: parsed.slot_version,
          type: parsed.type,
          payload: parsed.payload,
        });
      } catch {
        // ignore malformed frames
      }
    });

    ws.on("close", () => {
      store.browserConnected = false;
      unsub();
    });
  });

  return wss;
}
