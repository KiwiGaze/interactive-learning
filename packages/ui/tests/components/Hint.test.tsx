import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));

import { Hint } from "../../src/components/Hint.js";
import { sendUserEvent } from "../../src/state/use-ws.js";

describe("Hint", () => {
  it("emits hint.revealed when user clicks", async () => {
    const user = userEvent.setup();
    render(<Hint slotId="s" slotVersion={1} props={{ content: "Answer: 42" }} />);
    const toggle = screen.getByRole("button");
    expect(toggle).toHaveAttribute("aria-controls", "s-hint-1");
    await user.click(toggle);
    expect(sendUserEvent).toHaveBeenCalledWith("hint.revealed", { id: "s", version: 1 }, {});
    expect(screen.getByText(/Answer: 42/)).toBeInTheDocument();
  });
});
