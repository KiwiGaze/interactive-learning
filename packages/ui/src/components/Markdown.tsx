import type { MarkdownProps } from "@interactive-learning/protocol";
import { MarkdownPropsSchema } from "@interactive-learning/protocol";
import { useEffect, useState } from "react";
import type { AnchorHTMLAttributes, ReactElement } from "react";
import { UI_CATALOG } from "../catalog/catalog.js";
import { compileMdx } from "../mdx/compile.js";

function isExternalHref(href: string | undefined): boolean {
  if (!href) return false;
  try {
    const parsed = new URL(href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function SafeLink(props: AnchorHTMLAttributes<HTMLAnchorElement>): ReactElement {
  const externalRel = isExternalHref(props.href) ? "noopener noreferrer" : undefined;
  return <a {...props} rel={props.rel ?? externalRel} />;
}

function decodeInlineProps(props: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => {
      if (typeof value !== "string") return [key, value];
      const trimmed = value.trim();
      if (!/^(true|false|null|-?\d|\[|\{)/.test(trimmed)) return [key, value];
      try {
        return [key, JSON.parse(trimmed) as unknown];
      } catch {
        return [key, value];
      }
    }),
  );
}

function buildComponentMap(slotId: string, slotVersion: number): Record<string, unknown> {
  const componentMap: Record<string, unknown> = { a: SafeLink };
  for (const entry of UI_CATALOG.list()) {
    componentMap[entry.type] = (props: Record<string, unknown>) => (
      <entry.Component slotId={slotId} slotVersion={slotVersion} props={decodeInlineProps(props)} />
    );
  }
  return componentMap;
}

export function Markdown({
  slotId,
  slotVersion,
  props,
}: { slotId: string; slotVersion: number; props: unknown }) {
  const parsed: MarkdownProps = MarkdownPropsSchema.parse(props);
  const [rendered, setRendered] = useState<ReactElement | null>(null);
  const [err, setErr] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const allowed = new Set(UI_CATALOG.list().map((e) => e.type));
    const componentMap = buildComponentMap(slotId, slotVersion);
    compileMdx(parsed.content, allowed)
      .then(({ Component }) => {
        if (cancelled) return;
        setRendered(<Component components={componentMap} />);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setErr(e instanceof Error ? e : new Error(String(e)));
      });
    return () => {
      cancelled = true;
    };
  }, [parsed.content, slotId, slotVersion]);

  if (err) {
    return (
      <div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm">
        MDX rejected: {err.message}
      </div>
    );
  }
  if (!rendered) return <div className="text-sm text-muted-foreground">Rendering...</div>;
  return <article className="prose prose-slate max-w-none">{rendered}</article>;
}
