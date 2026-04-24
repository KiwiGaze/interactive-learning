import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { LessonMetaSchema } from "@interactive-learning/protocol";
import YAML from "yaml";
import { ZodError } from "zod";

const INTERACTIVE_COMPONENT_RE = /<(Quiz|Hint|StepByStep|FlashCard|Diagram)\b/;

export interface ValidationError {
  path: ReadonlyArray<string | number>;
  message: string;
  source: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export async function validateLesson(lessonDir: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const mjs = path.join(lessonDir, "meta.mjs");
  const ts = path.join(lessonDir, "meta.ts");
  const metaFile = (await exists(mjs)) ? mjs : (await exists(ts)) ? ts : "";

  if (!metaFile) {
    errors.push({ path: [], message: "meta.ts/meta.mjs missing", source: "meta" });
  } else {
    try {
      const mod = (await import(pathToFileURL(metaFile).href)) as { default?: unknown };
      LessonMetaSchema.parse(mod.default ?? mod);
    } catch (e) {
      if (e instanceof ZodError) {
        for (const iss of e.issues) {
          const issuePath = iss.path.filter((part) => typeof part !== "symbol");
          errors.push({ path: issuePath, message: iss.message, source: "meta" });
        }
      } else {
        errors.push({ path: [], message: String(e), source: "meta" });
      }
    }
  }

  const mdxFile = path.join(lessonDir, "index.mdx");
  if (!(await exists(mdxFile))) {
    errors.push({ path: [], message: "index.mdx missing", source: "mdx" });
  } else {
    const content = await fs.readFile(mdxFile, "utf8");
    if (!INTERACTIVE_COMPONENT_RE.test(content)) {
      errors.push({
        path: [],
        message: "index.mdx must include at least one interactive component",
        source: "mdx",
      });
    }
  }

  for (const file of ["quiz.yaml", "flashcards.yaml"]) {
    const abs = path.join(lessonDir, file);
    if (!(await exists(abs))) continue;
    try {
      YAML.parse(await fs.readFile(abs, "utf8"));
    } catch (e) {
      errors.push({ path: [file], message: String(e), source: "yaml" });
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

async function exists(p: string): Promise<boolean> {
  return fs
    .stat(p)
    .then(() => true)
    .catch(() => false);
}
