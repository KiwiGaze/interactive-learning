import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionClosed } from "../../src/pages/SessionClosed.js";

describe("SessionClosed", () => {
  it("uses clear hierarchy and shared button styling", () => {
    render(<SessionClosed />);

    expect(screen.getByRole("heading", { name: "Session ended" })).toBeInTheDocument();
    expect(screen.getByText("You can close this tab.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export session" })).toHaveClass("rounded-md");
    expect(screen.queryByText(/Phase 2/i)).not.toBeInTheDocument();
  });
});
