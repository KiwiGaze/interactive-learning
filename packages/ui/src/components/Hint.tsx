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

  const toggle = (): void => {
    if (!open) sendUserEvent("hint.revealed", slot, {});
    setOpen((v) => !v);
  };

  return (
    <div className="my-2">
      <Button variant="outline" size="sm" onClick={toggle} aria-expanded={open}>
        {parsed.label}
      </Button>
      {open ? (
        <div className="mt-2 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
          {parsed.content}
        </div>
      ) : null}
    </div>
  );
}
