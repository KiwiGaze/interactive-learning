import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "../../src/components/Markdown.js";

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
});
