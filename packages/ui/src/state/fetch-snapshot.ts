import { type SessionSnapshot, SessionSnapshotSchema } from "@interactive-learning/protocol";

export async function fetchSessionSnapshot(): Promise<SessionSnapshot> {
  const r = await fetch("/session/state");
  if (!r.ok) throw new Error(`/session/state returned ${r.status}`);
  const raw: unknown = await r.json();
  return SessionSnapshotSchema.parse(raw);
}
