import type { HintProps } from "@interactive-learning/protocol";
import { HintPropsSchema } from "@interactive-learning/protocol";
import { useState } from "react";
import { sendUserEvent } from "../state/use-ws.js";
import { Button } from "./ui/button.js";

export function Hint({
  slotId,
  slotVersion,
  props,
}: { slotId: string; slotVersion: number; props: unknown }) {
  const parsed: HintProps = HintPropsSchema.parse(props);
  const [open, setOpen] = useState(false);
  const slot = { id: slotId, version: slotVersion };
  const contentId = `${slotId}-hint-${slotVersion}`;

  const toggle = (): void => {
    if (!open) sendUserEvent("hint.revealed", slot, {});
    setOpen((v) => !v);
  };

  return (
    <div className="my-2">
      <Button
        variant="outline"
        size="sm"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={contentId}
      >
        {parsed.label}
      </Button>
      {open ? (
        <div id={contentId} className="mt-2 rounded border border-border bg-muted p-3 text-sm">
          {parsed.content}
        </div>
      ) : null}
    </div>
  );
}
