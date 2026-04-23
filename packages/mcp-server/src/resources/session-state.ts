import type { SessionStore } from "../session-store.js";

export async function readSessionStateResource(deps: { store: SessionStore }) {
  return {
    contents: [
      {
        uri: "session://current/state",
        mimeType: "application/json",
        text: JSON.stringify(deps.store.snapshot(), null, 2),
      },
    ],
  };
}
