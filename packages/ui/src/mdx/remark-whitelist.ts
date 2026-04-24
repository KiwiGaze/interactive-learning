import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const HTML_ALLOWLIST = new Map<string, ReadonlySet<string>>([
  ["a", new Set(["href", "title"])],
  ["abbr", new Set(["title"])],
  ["b", new Set()],
  ["blockquote", new Set()],
  ["br", new Set()],
  ["code", new Set()],
  ["del", new Set()],
  ["details", new Set(["open"])],
  ["em", new Set()],
  ["h1", new Set()],
  ["h2", new Set()],
  ["h3", new Set()],
  ["h4", new Set()],
  ["h5", new Set()],
  ["h6", new Set()],
  ["hr", new Set()],
  ["i", new Set()],
  ["img", new Set(["src", "alt", "title"])],
  ["kbd", new Set()],
  ["li", new Set()],
  ["ol", new Set()],
  ["p", new Set()],
  ["pre", new Set()],
  ["s", new Set()],
  ["span", new Set()],
  ["strong", new Set()],
  ["sub", new Set()],
  ["summary", new Set()],
  ["sup", new Set()],
  ["table", new Set()],
  ["tbody", new Set()],
  ["td", new Set()],
  ["th", new Set()],
  ["thead", new Set()],
  ["tr", new Set()],
  ["ul", new Set()],
]);

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const URL_ATTRIBUTES = new Set(["href", "src"]);

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

export function isSafeMdxUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("#") || trimmed.startsWith("/") || trimmed.startsWith("./")) return true;
  if (trimmed.startsWith("../")) return true;

  try {
    const parsed = new URL(trimmed);
    return SAFE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

function isComponentName(name: string): boolean {
  const first = name[0] ?? "";
  return first === first.toUpperCase() && first !== first.toLowerCase();
}

export const remarkWhitelist: Plugin<[WhitelistOptions], Root> = (opts) => {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === "link") {
        const link = node as { url?: unknown };
        if (typeof link.url !== "string" || !isSafeMdxUrl(link.url)) {
          throw new MdxSecurityError("Markdown link has an unsafe href", node);
        }
      }
      if (node.type === "image") {
        const image = node as { url?: unknown };
        if (typeof image.url !== "string" || !isSafeMdxUrl(image.url)) {
          throw new MdxSecurityError("Markdown image has an unsafe src", node);
        }
      }
      if (node.type === "mdxjsEsm") {
        throw new MdxSecurityError("MDX ESM (import/export) is not allowed", node);
      }
      if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
        throw new MdxSecurityError("MDX expressions ({...}) are not allowed", node);
      }
      if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
        const n = node as { name: string | null; attributes?: unknown[] };
        if (!n.name) throw new MdxSecurityError("Fragment-like JSX not allowed", node);
        const tagName = n.name.toLowerCase();
        const isComponent = isComponentName(n.name);
        if (isComponent && !opts.allowedComponents.has(n.name)) {
          throw new MdxSecurityError(`Component <${n.name}> is not in catalog`, node);
        }
        const htmlAttributes = isComponent ? undefined : HTML_ALLOWLIST.get(tagName);
        if (!isComponent && !htmlAttributes) {
          throw new MdxSecurityError(`HTML tag <${n.name}> is not allowed`, node);
        }
        for (const attr of n.attributes ?? []) {
          const a = attr as { type: string; name?: unknown; value?: unknown };
          if (a.type === "mdxJsxExpressionAttribute") {
            throw new MdxSecurityError("Spread / expression attributes not allowed", attr);
          }
          if (
            a.value &&
            typeof a.value === "object" &&
            "type" in a.value &&
            a.value.type === "mdxJsxAttributeValueExpression"
          ) {
            throw new MdxSecurityError("JSX attribute expressions not allowed", attr);
          }
          if (typeof a.name !== "string") continue;
          if (!isComponent) {
            if (!htmlAttributes?.has(a.name)) {
              throw new MdxSecurityError(
                `HTML tag <${n.name}> attribute ${a.name} is not allowed`,
                attr,
              );
            }
            if (URL_ATTRIBUTES.has(a.name)) {
              if (typeof a.value !== "string" || !isSafeMdxUrl(a.value)) {
                throw new MdxSecurityError(`HTML tag <${n.name}> has an unsafe ${a.name}`, attr);
              }
            }
          }
        }
      }
      if (node.type === "html") {
        throw new MdxSecurityError("Raw HTML is not allowed", node);
      }
    });
  };
};
