import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "../../src/catalog/register.js";
import { Markdown } from "../../src/components/Markdown.js";
import { sendUserEvent } from "../../src/state/use-ws.js";

vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));

describe("Markdown component", () => {
  it("renders plain MDX", async () => {
    render(<Markdown slotId="s" slotVersion={1} props={{ content: "# Hello **world**" }} />);
    await waitFor(() => expect(screen.getByText(/world/i)).toBeInTheDocument());
  });
  it("shows fallback on security violation (raw HTML script tag)", async () => {
    render(
      <Markdown slotId="s" slotVersion={1} props={{ content: "<script>alert(1)</script>" }} />,
    );
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
  it("adds safe external link attributes", async () => {
    render(
      <Markdown slotId="s" slotVersion={1} props={{ content: "[Example](https://example.com)" }} />,
    );

    const link = await screen.findByRole("link", { name: "Example" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("renders catalog components from inline MDX", async () => {
    render(
      <Markdown
        slotId="parent"
        slotVersion={7}
        props={{ content: `<Hint label="Show hint" content="Use substitution" />` }}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Show hint" }));

    expect(await screen.findByText("Use substitution")).toBeInTheDocument();
    expect(sendUserEvent).toHaveBeenCalledWith("hint.revealed", { id: "parent", version: 7 }, {});
  });
});
