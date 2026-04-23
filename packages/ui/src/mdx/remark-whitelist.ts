import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const FORBIDDEN_HTML_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "style",
]);

export interface WhitelistOptions {
  allowedComponents: ReadonlySet<string>;
}

export class MdxSecurityError extends Error {
  constructor(
    message: string,
    public readonly node: unknown,
  ) {
    super(message);
    this.name = "MdxSecurityError";
  }
}

export const remarkWhitelist: Plugin<[WhitelistOptions], Root> = (opts) => {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === "mdxjsEsm") {
        throw new MdxSecurityError("MDX ESM (import/export) is not allowed", node);
      }
      if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
        throw new MdxSecurityError("MDX expressions ({...}) are not allowed", node);
      }
      if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
        const n = node as { name: string | null; attributes?: unknown[] };
        if (!n.name) throw new MdxSecurityError("Fragment-like JSX not allowed", node);
        if (FORBIDDEN_HTML_TAGS.has(n.name.toLowerCase())) {
          throw new MdxSecurityError(`HTML tag <${n.name}> is not allowed`, node);
        }
        const first = n.name[0] ?? "";
        const isComponent = first === first.toUpperCase() && first !== first.toLowerCase();
        if (isComponent && !opts.allowedComponents.has(n.name)) {
          throw new MdxSecurityError(`Component <${n.name}> is not in catalog`, node);
        }
        for (const attr of n.attributes ?? []) {
          const a = attr as { type: string; value?: { type?: string } };
          if (a.type === "mdxJsxExpressionAttribute") {
            throw new MdxSecurityError("Spread / expression attributes not allowed", attr);
          }
          if (
            a.value &&
            typeof a.value === "object" &&
            a.value.type === "mdxJsxAttributeValueExpression"
          ) {
            throw new MdxSecurityError("JSX attribute expressions not allowed", attr);
          }
        }
      }
      if (node.type === "html") {
        throw new MdxSecurityError("Raw HTML is not allowed", node);
      }
    });
  };
};
