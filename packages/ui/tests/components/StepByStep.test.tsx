import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));

import { StepByStep } from "../../src/components/StepByStep.js";
import { sendUserEvent } from "../../src/state/use-ws.js";

describe("StepByStep", () => {
  it("emits step.expanded on open and step.marked_done on button click", async () => {
    const user = userEvent.setup();
    render(
      <StepByStep
        slotId="s1"
        slotVersion={1}
        props={{
          steps: [{ id: "a", heading: "A", content: "aa", initially_open: false, required: false }],
          navigation: "free",
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /A/ }));
    const toggle = screen.getByRole("button", { name: /A/ });
    expect(toggle).toHaveAttribute("aria-controls", "s1-step-a");
    expect(sendUserEvent).toHaveBeenCalledWith(
      "step.expanded",
      { id: "s1", version: 1 },
      { step_id: "a" },
    );
    await user.click(screen.getByRole("button", { name: /mark done/i }));
    expect(sendUserEvent).toHaveBeenCalledWith(
      "step.marked_done",
      { id: "s1", version: 1 },
      { step_id: "a" },
    );
  });

  it("renders step markdown content", async () => {
    const user = userEvent.setup();
    render(
      <StepByStep
        slotId="s1"
        slotVersion={1}
        props={{
          steps: [
            {
              id: "a",
              heading: "A",
              content: "Use **substitution**.",
              initially_open: false,
              required: false,
            },
          ],
          navigation: "free",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /A/ }));

    expect(await screen.findByText("substitution")).toBeInTheDocument();
    expect(screen.getByText("substitution").tagName).toBe("STRONG");
  });
});
