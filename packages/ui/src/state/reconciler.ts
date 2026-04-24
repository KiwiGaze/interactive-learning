import type { SessionSnapshot } from "@interactive-learning/protocol";

export interface QueuedReconcilerDeps {
  fetchSnapshot: () => Promise<SessionSnapshot>;
  applySnapshot: (snapshot: SessionSnapshot) => void;
  isActive: () => boolean;
}

export function createQueuedReconciler(deps: QueuedReconcilerDeps): () => Promise<void> {
  let inFlight: Promise<void> | undefined;
  let queued = false;

  return function reconcile(): Promise<void> {
    if (inFlight) {
      queued = true;
      return inFlight;
    }

    inFlight = runQueuedReconcile(
      deps,
      () => queued,
      (value) => {
        queued = value;
      },
    ).finally(() => {
      inFlight = undefined;
    });
    return inFlight;
  };
}

async function runQueuedReconcile(
  deps: QueuedReconcilerDeps,
  getQueued: () => boolean,
  setQueued: (value: boolean) => void,
): Promise<void> {
  do {
    setQueued(false);
    try {
      const snapshot = await deps.fetchSnapshot();
      if (deps.isActive()) deps.applySnapshot(snapshot);
    } catch {
      // best-effort reconcile; next event or reconnect will retry
    }
  } while (getQueued() && deps.isActive());
}
