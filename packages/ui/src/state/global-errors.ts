import { sendUserEvent } from "./use-ws.js";

const SESSION_SLOT = { id: "__session__", version: 0 };

export function attachGlobalErrorHandlers(): void {
  window.addEventListener("error", (e) => {
    const stack = e.error instanceof Error ? e.error.stack : undefined;
    sendUserEvent("session.uncaught_error", SESSION_SLOT, {
      message: e.message,
      ...(stack ? { stack } : {}),
    });
  });
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    sendUserEvent("session.uncaught_error", SESSION_SLOT, {
      message: reason instanceof Error ? reason.message : String(reason),
      ...(reason instanceof Error && reason.stack ? { stack: reason.stack } : {}),
    });
  });
}
