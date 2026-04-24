import { expect, test } from "@playwright/test";
import { renderComponent, startServer, waitForEvents } from "./fixture.js";

test("FlashCard flips and records a rating", async ({ page }) => {
  const server = await startServer();
  try {
    const rendered = await renderComponent(server.client, "FlashCard", {
      deck_id: "deck",
      cards: [{ id: "c1", front: "Front", back: "Back" }],
      show_progress: true,
    });
    await page.goto("http://127.0.0.1:7654/");
    await page.getByRole("button", { name: "Flip" }).click();
    await expect(page.getByText("Back")).toBeVisible();
    await page.getByRole("button", { name: "good" }).click();

    const events = await waitForEvents(server.client, rendered.cursor);
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining(["flashcard.flipped", "flashcard.rated"]),
    );
  } finally {
    await server.close();
  }
});

test("StepByStep marks a step done", async ({ page }) => {
  const server = await startServer();
  try {
    const rendered = await renderComponent(server.client, "StepByStep", {
      steps: [{ id: "s1", heading: "Open me", content: "Done means continue." }],
      navigation: "free",
    });
    await page.goto("http://127.0.0.1:7654/");
    await page.getByRole("button", { name: "Open me" }).click();
    await page.getByRole("button", { name: "Mark done" }).click();

    const events = await waitForEvents(server.client, rendered.cursor);
    expect(events.map((event) => event.type)).toContain("step.marked_done");
  } finally {
    await server.close();
  }
});

test("Hint reveals content", async ({ page }) => {
  const server = await startServer();
  try {
    const rendered = await renderComponent(server.client, "Hint", {
      label: "Show hint",
      content: "Use substitution.",
    });
    await page.goto("http://127.0.0.1:7654/");
    await page.getByRole("button", { name: "Show hint" }).click();
    await expect(page.getByText("Use substitution.")).toBeVisible();

    const events = await waitForEvents(server.client, rendered.cursor);
    expect(events.map((event) => event.type)).toContain("hint.revealed");
  } finally {
    await server.close();
  }
});
