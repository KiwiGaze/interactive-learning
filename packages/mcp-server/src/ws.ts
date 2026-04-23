import type { Server as HttpServer } from "node:http";
import { type WebSocket, WebSocketServer } from "ws";
import type { SessionStore } from "./session-store.js";

export interface WsOptions {
  allowedOrigins: readonly string[];
}

const INBOUND_KIND = "event";

// Policy Violation close code — tells the client the connection was refused
// due to policy, resulting in a clean close frame rather than a socket destroy
// that would cause the ws client to emit an unhandled 'error' event.
const WS_POLICY_VIOLATION = 1008;

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
    if (req.url !== "/ws") return;
    const origin = req.headers.origin ?? "";
    if (!opts.allowedOrigins.includes(origin)) {
      rejectWss.handleUpgrade(req, socket, head, (ws) => rejectWss.emit("connection", ws, req));
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  wss.on("connection", (ws: WebSocket) => {
    store.browserConnected = true;

    const unsub = store.onEvent((ev) => {
      ws.send(JSON.stringify({ kind: "event", event: ev }));
    });

    ws.on("message", (raw) => {
      try {
        const parsed = JSON.parse(raw.toString()) as { kind?: string } & Record<string, unknown>;
        if (parsed.kind !== INBOUND_KIND) return;
        store.recordEvent({
          slot_id: String(parsed.slot_id),
          slot_version: Number(parsed.slot_version),
          type: String(parsed.type),
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
