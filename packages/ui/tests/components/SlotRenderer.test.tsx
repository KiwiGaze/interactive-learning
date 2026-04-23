import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { UI_CATALOG } from "../../src/catalog/catalog.js";
import { SlotRenderer } from "../../src/components/SlotRenderer.js";

describe("SlotRenderer", () => {
  beforeEach(() => {
    UI_CATALOG.register({
      type: "Stub",
      Component: () => <div>hello</div>,
      propsSchema: undefined,
    });
  });

  it("renders a known component", () => {
    render(<SlotRenderer slot={{ slot_id: "a", version: 1, type: "Stub", props: {} }} />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("shows fallback UI for unknown component", () => {
    render(<SlotRenderer slot={{ slot_id: "b", version: 1, type: "Nope", props: {} }} />);
    expect(screen.getByText(/Unknown component/i)).toBeInTheDocument();
  });
});
