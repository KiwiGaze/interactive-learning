import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));

import { attachGlobalErrorHandlers } from "../../src/state/global-errors.js";
import { sendUserEvent } from "../../src/state/use-ws.js";

describe("global error handlers", () => {
  it("includes stack for Error objects", () => {
    attachGlobalErrorHandlers();
    const error = new Error("boom");

    window.dispatchEvent(new ErrorEvent("error", { message: "boom", error }));

    expect(sendUserEvent).toHaveBeenCalledWith(
      "session.uncaught_error",
      { id: "__session__", version: 0 },
      expect.objectContaining({ message: "boom", stack: expect.stringContaining("boom") }),
    );
  });
});
