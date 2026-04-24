import type { StepByStepProps } from "@interactive-learning/protocol";
import { StepByStepPropsSchema } from "@interactive-learning/protocol";
import { useState } from "react";
import { sendUserEvent } from "../state/use-ws.js";
import { Markdown } from "./Markdown.js";
import { Button } from "./ui/button.js";

function panelClasses(open: boolean): string {
  const base = "grid transition-[grid-template-rows,opacity] duration-200";
  if (open) return `${base} grid-rows-[1fr] border-t border-border opacity-100`;
  return `${base} grid-rows-[0fr] opacity-0`;
}

export function StepByStep({
  slotId,
  slotVersion,
  props,
}: { slotId: string; slotVersion: number; props: unknown }) {
  const parsed: StepByStepProps = StepByStepPropsSchema.parse(props);
  const slot = { id: slotId, version: slotVersion };
  const [open, setOpen] = useState<Set<string>>(
    new Set(parsed.steps.filter((s) => s.initially_open).map((s) => s.id)),
  );
  const [done, setDone] = useState<Set<string>>(new Set());

  const toggle = (id: string): void => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        sendUserEvent("step.collapsed", slot, { step_id: id });
      } else {
        next.add(id);
        sendUserEvent("step.expanded", slot, { step_id: id });
      }
      return next;
    });
  };

  const markDone = (id: string): void => {
    setDone((prev) => new Set(prev).add(id));
    sendUserEvent("step.marked_done", slot, { step_id: id });
  };

  const isDisabled = (index: number): boolean => {
    if (parsed.navigation !== "sequential") return false;
    if (index === 0) return false;
    const prev = parsed.steps[index - 1];
    return !(prev && done.has(prev.id));
  };

  return (
    <section className="space-y-2">
      {parsed.title ? <h3 className="text-lg font-semibold">{parsed.title}</h3> : null}
      <ol className="space-y-2">
        {parsed.steps.map((s, i) => {
          const disabled = isDisabled(i);
          const isOpen = open.has(s.id);
          const contentId = `${slotId}-step-${s.id}`;
          return (
            <li key={s.id} className="rounded border border-border bg-card">
              <button
                type="button"
                onClick={() => !disabled && toggle(s.id)}
                disabled={disabled}
                aria-expanded={isOpen}
                aria-controls={contentId}
                className="w-full px-4 py-2 text-left font-medium disabled:cursor-not-allowed disabled:text-muted-foreground"
              >
                {s.heading}
              </button>
              <div id={contentId} className={panelClasses(isOpen)} hidden={!isOpen}>
                <div className="min-h-0 overflow-hidden">
                  <div className="space-y-3 px-4 py-3 text-sm">
                    <Markdown
                      slotId={slotId}
                      slotVersion={slotVersion}
                      props={{ content: s.content }}
                    />
                    {!done.has(s.id) ? (
                      <Button size="sm" variant="outline" onClick={() => markDone(s.id)}>
                        Mark done
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
