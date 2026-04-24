import type { EventEnvelope } from "@interactive-learning/protocol";
import { useEffect } from "react";
import { fetchSessionSnapshot } from "./fetch-snapshot.js";
import { useSessionStore } from "./session-store.js";

declare global {
  interface Window {
    // Non-optional with undefined in the union so exactOptionalPropertyTypes allows assignment.
    __il_ws: WebSocket | undefined;
  }
}

export function useSessionWebSocket(): void {
  const onRemote = useSessionStore((s) => s.onRemoteEvent);
  const setConn = useSessionStore((s) => s.setConnected);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let backoff = 500;
    let closed = false;
    let reconcilePromise: Promise<void> | undefined;

    function reconcileSnapshot(activeSocket: WebSocket): Promise<void> {
      reconcilePromise ??= fetchSessionSnapshot()
        .then((snap) => {
          if (!closed && ws === activeSocket) useSessionStore.getState().applySnapshot(snap);
        })
        .catch(() => {
          // best-effort reconcile; next event or reconnect will retry
        })
        .finally(() => {
          reconcilePromise = undefined;
        });
      return reconcilePromise;
    }

    function connect(): void {
      const cursor = useSessionStore.getState().cursor;
      const since = cursor ? `?since=${encodeURIComponent(cursor)}` : "";
      ws = new WebSocket(`ws://${location.host}/ws${since}`);
      window.__il_ws = ws;
      const activeSocket = ws;
      ws.onopen = async () => {
        setConn(true);
        backoff = 500;
        await reconcileSnapshot(activeSocket);
      };
      ws.onclose = () => {
        setConn(false);
        window.__il_ws = undefined;
        if (!closed) {
          backoff = Math.min(backoff * 2, 10_000);
          setTimeout(connect, backoff);
        }
      };
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(String(msg.data)) as { kind?: string; event?: EventEnvelope };
          if (data.kind !== "event" || !data.event) return;
          onRemote(data.event);
          if (data.event.type === "component.rendered" || data.event.type === "component.updated") {
            void reconcileSnapshot(activeSocket);
          }
        } catch {
          // ignore malformed frames
        }
      };
    }
    connect();

    return () => {
      closed = true;
      ws?.close();
    };
  }, [onRemote, setConn]);
}

export function sendUserEvent(
  type: string,
  slot: { id: string; version: number },
  payload: unknown,
): void {
  const ws = window.__il_ws;
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      kind: "event",
      slot_id: slot.id,
      slot_version: slot.version,
      type,
      payload,
    }),
  );
}
