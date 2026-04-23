import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: `<svg data-testid="m"/>`, bindFunctions: undefined }),
  },
}));
vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));

import { Diagram } from "../../src/components/Diagram.js";

describe("Diagram", () => {
  it("renders mermaid output", async () => {
    render(<Diagram slotId="s" slotVersion={1} props={{ source: "graph TD; A-->B" }} />);
    await waitFor(() => expect(screen.getByTestId("m")).toBeInTheDocument());
  });
});
