import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));

import { FlashCard } from "../../src/components/FlashCard.js";
import { sendUserEvent } from "../../src/state/use-ws.js";

describe("FlashCard", () => {
  it("emits flipped, rated, deck_completed", async () => {
    const user = userEvent.setup();
    render(
      <FlashCard
        slotId="s1"
        slotVersion={1}
        props={{
          deck_id: "d1",
          cards: [{ id: "c1", front: "Q?", back: "A!" }],
          mode: "study",
          show_progress: true,
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: /flip/i }));
    await user.click(screen.getByRole("button", { name: /good/i }));
    expect(sendUserEvent).toHaveBeenCalledWith(
      "flashcard.flipped",
      { id: "s1", version: 1 },
      { card_id: "c1" },
    );
    expect(sendUserEvent).toHaveBeenCalledWith(
      "flashcard.rated",
      { id: "s1", version: 1 },
      { card_id: "c1", rating: "good" },
    );
    expect(sendUserEvent).toHaveBeenCalledWith(
      "flashcard.deck_completed",
      { id: "s1", version: 1 },
      { card_ids_seen: ["c1"] },
    );
  });

  it("exposes front/back faces and flipped state", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FlashCard
        slotId="s1"
        slotVersion={1}
        props={{
          deck_id: "d1",
          cards: [{ id: "c1", front: "Front", back: "Back" }],
          mode: "study",
          show_progress: false,
        }}
      />,
    );

    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
    expect(container.querySelector('[data-state="front"]')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /flip/i }));

    expect(container.querySelector('[data-state="flipped"]')).toBeInTheDocument();
  });
});
