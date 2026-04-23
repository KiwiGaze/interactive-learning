import { describe, expect, it, vi } from "vitest";
import { IdleWatchdog } from "../src/lifecycle.js";
import { SessionStore } from "../src/session-store.js";

describe("IdleWatchdog", () => {
  it("emits warn at warnMs, terminates at terminateMs", () => {
    vi.useFakeTimers();
    try {
      const store = new SessionStore();
      const onWarn = vi.fn();
      const onTerminate = vi.fn();
      const w = new IdleWatchdog(store, {
        warnMs: 25 * 60_000,
        terminateMs: 30 * 60_000,
        onWarn,
        onTerminate,
      });
      w.start();
      vi.advanceTimersByTime(25 * 60_000 + 1);
      expect(onWarn).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(5 * 60_000);
      expect(onTerminate).toHaveBeenCalledTimes(1);
      w.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it("resets timers on ping", () => {
    vi.useFakeTimers();
    try {
      const store = new SessionStore();
      const onTerminate = vi.fn();
      const w = new IdleWatchdog(store, {
        warnMs: 25,
        terminateMs: 30,
        onWarn: () => {},
        onTerminate,
      });
      w.start();
      vi.advanceTimersByTime(20);
      w.ping();
      vi.advanceTimersByTime(20);
      expect(onTerminate).not.toHaveBeenCalled();
      w.stop();
    } finally {
      vi.useRealTimers();
    }
  });
});
