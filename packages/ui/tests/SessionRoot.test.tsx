import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionRoot } from "../src/SessionRoot.js";
import { useSessionStore } from "../src/state/session-store.js";

describe("SessionRoot", () => {
  it("shows empty state when no slots", () => {
    useSessionStore.setState({ slots: [] });
    render(<SessionRoot />);
    expect(screen.getByText(/Waiting for the lesson to start/i)).toBeInTheDocument();
  });
});
