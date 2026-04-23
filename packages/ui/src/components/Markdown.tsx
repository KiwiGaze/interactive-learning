import type { MarkdownProps } from "@interactive-learning/protocol";
import { MarkdownPropsSchema } from "@interactive-learning/protocol";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { UI_CATALOG } from "../catalog/catalog.js";
import { compileMdx } from "../mdx/compile.js";

export function Markdown({ props }: { slotId: string; slotVersion: number; props: unknown }) {
  const parsed: MarkdownProps = MarkdownPropsSchema.parse(props);
  const [rendered, setRendered] = useState<ReactElement | null>(null);
  const [err, setErr] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const allowed = new Set(UI_CATALOG.list().map((e) => e.type));
    compileMdx(parsed.content, allowed)
      .then(({ Component }) => {
        if (cancelled) return;
        setRendered(<Component />);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      cancelled = true;
    };
  }, [parsed.content]);

  if (err) {
    return (
      <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm">
        MDX rejected: {err.message}
      </div>
    );
  }
  if (!rendered) return <div className="text-sm text-slate-500">Rendering...</div>;
  return <article className="prose prose-slate max-w-none">{rendered}</article>;
}
