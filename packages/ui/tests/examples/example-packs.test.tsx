import fs from "node:fs/promises";
import path from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "../../src/catalog/register.js";
import { Markdown } from "../../src/components/Markdown.js";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg />", diagramType: "flowchart-v2" }),
  },
}));

vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));

const examplesRoot = path.resolve(process.cwd(), "../examples");
const packs = ["python-decorators", "history-silk-road", "geometry-triangles"];

describe("example packs", () => {
  it.each(packs)("renders interactive MDX components from %s", async (pack) => {
    const content = await fs.readFile(path.join(examplesRoot, pack, "index.mdx"), "utf8");

    render(<Markdown slotId={pack} slotVersion={1} props={{ content }} />);

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getAllByRole("button").length).toBeGreaterThan(0));
  });
});
