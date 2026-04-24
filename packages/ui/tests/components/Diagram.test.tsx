import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({
      svg: `<svg data-testid="m"><g class="node" id="node-a">A</g><path class="edgePath" /></svg>`,
      bindFunctions: undefined,
    }),
  },
}));
vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));

import mermaid from "mermaid";
import { Diagram } from "../../src/components/Diagram.js";
import { sendUserEvent } from "../../src/state/use-ws.js";

afterEach(() => {
  vi.clearAllMocks();
});

describe("Diagram", () => {
  it("renders mermaid output", async () => {
    render(<Diagram slotId="s" slotVersion={1} props={{ source: "graph TD; A-->B" }} />);
    await waitFor(() => expect(screen.getByTestId("m")).toBeInTheDocument());
  });
  it("sanitizes unsafe SVG before insertion", async () => {
    vi.mocked(mermaid.render).mockResolvedValueOnce({
      svg: `<svg><g class="node" onclick="alert(1)" data-id="safe">A</g><script>alert(1)</script></svg>`,
      diagramType: "flowchart-v2",
    });

    const { container } = render(
      <Diagram slotId="s" slotVersion={1} props={{ source: "graph TD; A-->B" }} />,
    );

    await waitFor(() => expect(container.querySelector("svg")).toBeInTheDocument());
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(container.querySelector(".node")).not.toHaveAttribute("onclick");
  });
  it("shows loading state before render resolves", () => {
    vi.mocked(mermaid.render).mockReturnValueOnce(new Promise(() => undefined));

    render(<Diagram slotId="s" slotVersion={1} props={{ source: "graph TD; A-->B" }} />);

    expect(screen.getByText("Rendering diagram...")).toBeInTheDocument();
  });
  it("renders styled alert content when rendering fails", async () => {
    vi.mocked(mermaid.render).mockRejectedValueOnce(new Error("bad graph"));

    render(<Diagram slotId="s" slotVersion={1} props={{ source: "not a graph" }} />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Diagram render error");
    expect(alert).toHaveClass("border-red-300");
  });
  it("uses a fresh render id and clears stale SVG on rerender", async () => {
    const { rerender, container } = render(
      <Diagram slotId="s" slotVersion={1} props={{ source: "graph TD; A-->B" }} />,
    );
    await waitFor(() => expect(container.querySelector("svg")).toBeInTheDocument());

    vi.mocked(mermaid.render).mockReturnValueOnce(new Promise(() => undefined));
    rerender(<Diagram slotId="s" slotVersion={2} props={{ source: "graph TD; A-->C" }} />);

    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(vi.mocked(mermaid.render).mock.calls[0]?.[0]).not.toEqual(
      vi.mocked(mermaid.render).mock.calls[1]?.[0],
    );
  });
  it("emits diagram.node_clicked for Mermaid nodes", async () => {
    render(<Diagram slotId="s" slotVersion={1} props={{ source: "graph TD; A-->B" }} />);

    const node = await screen.findByText("A");
    fireEvent.click(node);

    expect(sendUserEvent).toHaveBeenCalledWith(
      "diagram.node_clicked",
      { id: "s", version: 1 },
      { node_id: "node-a" },
    );
  });
});
