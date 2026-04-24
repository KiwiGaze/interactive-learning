import type { DiagramProps } from "@interactive-learning/protocol";
import { DiagramPropsSchema } from "@interactive-learning/protocol";
import DOMPurify from "dompurify";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { sendUserEvent } from "../state/use-ws.js";

type MermaidModule = typeof import("mermaid");
type MermaidApi = MermaidModule["default"];

let mermaidPromise: Promise<MermaidApi> | undefined;
let renderSequence = 0;

async function loadMermaid(): Promise<MermaidApi> {
  mermaidPromise ??= import("mermaid").then((mod) => {
    mod.default.initialize({ startOnLoad: false, securityLevel: "strict" });
    return mod.default;
  });
  return mermaidPromise;
}

function nextRenderId(slotId: string, slotVersion: number): string {
  renderSequence += 1;
  const safeSlotId = slotId.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `mermaid-${safeSlotId}-${slotVersion}-${renderSequence}`;
}

function nodeIdFromClick(target: EventTarget | null): string | undefined {
  if (!(target instanceof Element)) return undefined;
  const node = target.closest(".node");
  if (!node) return undefined;
  return node.id || node.getAttribute("data-id") || node.textContent?.trim() || undefined;
}

export function Diagram({
  slotId,
  slotVersion,
  props,
}: { slotId: string; slotVersion: number; props: unknown }) {
  const parsed: DiagramProps = DiagramPropsSchema.parse(props);
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const slot = { id: slotId, version: slotVersion };
    const renderId = nextRenderId(slotId, slotVersion);
    setStatus("loading");
    if (ref.current) ref.current.replaceChildren();

    loadMermaid()
      .then((mermaid) => mermaid.render(renderId, parsed.source))
      .then(({ svg }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = DOMPurify.sanitize(svg, {
          USE_PROFILES: { svg: true, svgFilters: true },
        });
        const nodes = ref.current.querySelectorAll(".node").length;
        const edges = ref.current.querySelectorAll(".edgePath").length;
        setStatus("ready");
        sendUserEvent("diagram.rendered", slot, { nodes, edges });
      })
      .catch(() => {
        if (cancelled) return;
        if (ref.current) ref.current.replaceChildren();
        setStatus("error");
      });
    return () => {
      cancelled = true;
      if (ref.current) ref.current.replaceChildren();
    };
  }, [parsed.source, slotId, slotVersion]);

  const onNodeClick = (event: MouseEvent<HTMLDivElement>): void => {
    const nodeId = nodeIdFromClick(event.target);
    if (!nodeId) return;
    sendUserEvent(
      "diagram.node_clicked",
      { id: slotId, version: slotVersion },
      { node_id: nodeId },
    );
  };

  const onNodeKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const nodeId = nodeIdFromClick(event.target);
    if (!nodeId) return;
    sendUserEvent(
      "diagram.node_clicked",
      { id: slotId, version: slotVersion },
      { node_id: nodeId },
    );
  };

  return (
    <figure className="my-4">
      {status === "loading" ? (
        <div className="rounded border border-border bg-muted p-3 text-sm text-muted-foreground">
          Rendering diagram...
        </div>
      ) : null}
      {status === "error" ? (
        <div
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700"
        >
          Diagram render error
        </div>
      ) : null}
      <div
        ref={ref}
        role="img"
        aria-label="diagram"
        onClick={onNodeClick}
        onKeyDown={onNodeKeyDown}
      />
      {parsed.caption ? (
        <figcaption className="mt-2 text-sm text-muted-foreground">{parsed.caption}</figcaption>
      ) : null}
    </figure>
  );
}
