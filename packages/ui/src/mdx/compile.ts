import { compile, run } from "@mdx-js/mdx";
import type { ComponentType } from "react";
import * as runtime from "react/jsx-runtime";
import { remarkWhitelist } from "./remark-whitelist.js";

export async function compileMdx(
  src: string,
  allowedComponents: ReadonlySet<string>,
): Promise<{ Component: ComponentType }> {
  const code = String(
    await compile(src, {
      outputFormat: "function-body",
      development: false,
      remarkPlugins: [[remarkWhitelist, { allowedComponents }]],
    }),
  );
  const mod = await run(code, { ...runtime, baseUrl: import.meta.url });
  return { Component: mod.default as ComponentType };
}
