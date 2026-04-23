import type { EventEnvelope, SessionSnapshot, SlotState } from "@interactive-learning/protocol";
import { create } from "zustand";

interface SessionUiState {
  sessionId: string;
  cursor: string;
  slots: SlotState[];
  connected: boolean;
  sessionEnded: boolean;
  applySnapshot: (snap: SessionSnapshot) => void;
  onRemoteEvent: (e: EventEnvelope) => void;
  setConnected: (v: boolean) => void;
}

export const useSessionStore = create<SessionUiState>((set) => ({
  sessionId: "",
  cursor: "",
  slots: [],
  connected: false,
  sessionEnded: false,
  applySnapshot: (snap) =>
    set({
      sessionId: snap.id,
      cursor: snap.cursor,
      slots: [...snap.slots],
      connected: snap.browser_connected,
    }),
  onRemoteEvent: (e) => {
    if (e.type === "session.ended") {
      set({ cursor: e.event_id, sessionEnded: true });
    } else {
      set({ cursor: e.event_id });
    }
  },
  setConnected: (v) => set({ connected: v }),
}));
