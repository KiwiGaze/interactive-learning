import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import { MdxSecurityError, remarkWhitelist } from "../../src/mdx/remark-whitelist.js";

function run(src: string, allowed: string[] = []) {
  const pipeline = unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkWhitelist, { allowedComponents: new Set(allowed) });
  return pipeline.runSync(pipeline.parse(src));
}

describe("remarkWhitelist", () => {
  it("allows plain markdown", () => {
    expect(() => run("# Hello **world**")).not.toThrow();
  });
  it("allows whitelisted component with plain attributes", () => {
    expect(() => run(`<Quiz title="A"/>`, ["Quiz"])).not.toThrow();
  });
  it("rejects non-whitelisted component", () => {
    expect(() => run("<EvilWidget/>", ["Quiz"])).toThrow(MdxSecurityError);
  });
  it("rejects ESM import", () => {
    expect(() => run("import x from './y'\n\n# h", ["Quiz"])).toThrow(/ESM/);
  });
  it("rejects {expression}", () => {
    expect(() => run("# {eval('1')}", [])).toThrow(/expression/i);
  });
  it("rejects JSX attribute expression", () => {
    expect(() => run("<Quiz onX={() => {}}/>", ["Quiz"])).toThrow(/attribute expression/);
  });
});
