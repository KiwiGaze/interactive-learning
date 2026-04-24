import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));

import { Quiz } from "../../src/components/Quiz.js";
import { sendUserEvent } from "../../src/state/use-ws.js";

describe("Quiz", () => {
  it("submits answer_submitted + all_submitted", async () => {
    const user = userEvent.setup();
    render(
      <Quiz
        slotId="s1"
        slotVersion={1}
        props={{
          questions: [
            {
              id: "q1",
              kind: "single_choice",
              prompt: "Pick b",
              options: [
                { id: "a", label: "A", is_correct: false },
                { id: "b", label: "B", is_correct: true },
              ],
            },
          ],
          reveal_mode: "on_submit",
          allow_retry: true,
        }}
      />,
    );
    await user.click(screen.getByLabelText("B"));
    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(sendUserEvent).toHaveBeenCalledWith(
      "quiz.answer_submitted",
      { id: "s1", version: 1 },
      { question_id: "q1", value: "b" },
    );
    expect(sendUserEvent).toHaveBeenCalledWith(
      "quiz.all_submitted",
      { id: "s1", version: 1 },
      { answers: { q1: "b" } },
    );
  });

  it("submits multi-choice answers as arrays", async () => {
    const user = userEvent.setup();
    render(
      <Quiz
        slotId="s1"
        slotVersion={1}
        props={{
          questions: [
            {
              id: "q1",
              kind: "multi_choice",
              prompt: "Pick letters",
              options: [
                { id: "a", label: "A" },
                { id: "b", label: "B" },
              ],
            },
          ],
        }}
      />,
    );

    await user.click(screen.getByLabelText("A"));
    await user.click(screen.getByLabelText("B"));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(sendUserEvent).toHaveBeenCalledWith(
      "quiz.all_submitted",
      { id: "s1", version: 1 },
      { answers: { q1: ["a", "b"] } },
    );
  });

  it("emits short-answer only on submit", async () => {
    const user = userEvent.setup();
    render(
      <Quiz
        slotId="s1"
        slotVersion={1}
        props={{
          questions: [{ id: "q1", kind: "short_answer", prompt: "Name it" }],
        }}
      />,
    );

    await user.type(screen.getByRole("textbox"), "triangle");

    expect(sendUserEvent).not.toHaveBeenCalledWith(
      "quiz.answer_submitted",
      { id: "s1", version: 1 },
      { question_id: "q1", value: "triangle" },
    );

    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(sendUserEvent).toHaveBeenCalledWith(
      "quiz.answer_submitted",
      { id: "s1", version: 1 },
      { question_id: "q1", value: "triangle" },
    );
  });

  it("shows correctness feedback after submit", async () => {
    const user = userEvent.setup();
    render(
      <Quiz
        slotId="s1"
        slotVersion={1}
        props={{
          questions: [
            {
              id: "q1",
              kind: "single_choice",
              prompt: "Pick b",
              options: [
                { id: "a", label: "A", is_correct: false },
                { id: "b", label: "B", is_correct: true },
              ],
            },
          ],
          reveal_mode: "on_submit",
        }}
      />,
    );

    await user.click(screen.getByLabelText("B"));
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(screen.getByRole("status")).toHaveTextContent("Correct");
  });
});
