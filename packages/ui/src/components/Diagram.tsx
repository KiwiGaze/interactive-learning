import type { DiagramProps } from "@interactive-learning/protocol";
import { DiagramPropsSchema } from "@interactive-learning/protocol";
import mermaid from "mermaid";
import { useEffect, useRef } from "react";
import { sendUserEvent } from "../state/use-ws.js";

mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

export function Diagram({
  slotId,
  slotVersion,
  props,
}: { slotId: string; slotVersion: number; props: unknown }) {
  const parsed: DiagramProps = DiagramPropsSchema.parse(props);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const slot = { id: slotId, version: slotVersion };
    const renderId = `mermaid-${slotId}-${slotVersion}`;
    mermaid
      .render(renderId, parsed.source)
      .then(({ svg }) => {
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = svg;
        const nodes = ref.current.querySelectorAll(".node").length;
        const edges = ref.current.querySelectorAll(".edgePath").length;
        sendUserEvent("diagram.rendered", slot, { nodes, edges });
      })
      .catch(() => {
        if (!ref.current || cancelled) return;
        ref.current.innerText = "Diagram render error";
      });
    return () => {
      cancelled = true;
    };
  }, [parsed.source, slotId, slotVersion]);

  return (
    <figure className="my-4">
      <div ref={ref} role="img" aria-label="diagram" />
      {parsed.caption ? (
        <figcaption className="mt-2 text-sm text-slate-500">{parsed.caption}</figcaption>
      ) : null}
    </figure>
  );
}
