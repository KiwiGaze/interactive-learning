import { sendUserEvent } from "./use-ws.js";

const SESSION_SLOT = { id: "__session__", version: 0 };

export function attachGlobalErrorHandlers(): void {
  window.addEventListener("error", (e) => {
    sendUserEvent("session.uncaught_error", SESSION_SLOT, { message: e.message });
  });
  window.addEventListener("unhandledrejection", (e) => {
    sendUserEvent("session.uncaught_error", SESSION_SLOT, { message: String(e.reason) });
  });
}
