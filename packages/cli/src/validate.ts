import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  FlashCardPropsSchema,
  LessonMetaSchema,
  QuizPropsSchema,
} from "@interactive-learning/protocol";
import YAML from "yaml";
import { ZodError } from "zod";

const INTERACTIVE_COMPONENT_RE = /<(Quiz|Hint|StepByStep|FlashCard|Diagram)\b/;
const SIDE_CAR_SCHEMAS: Record<string, { parse: (value: unknown) => unknown }> = {
  "quiz.yaml": QuizPropsSchema,
  "flashcards.yaml": FlashCardPropsSchema,
};

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
        pushZodIssues(errors, "meta", [], e);
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

  for (const [file, schema] of Object.entries(SIDE_CAR_SCHEMAS)) {
    const abs = path.join(lessonDir, file);
    if (!(await exists(abs))) continue;
    try {
      const parsed = YAML.parse(await fs.readFile(abs, "utf8")) as unknown;
      schema.parse(parsed);
    } catch (e) {
      if (e instanceof ZodError) {
        pushZodIssues(errors, "yaml", [file], e);
      } else {
        errors.push({ path: [file], message: String(e), source: "yaml" });
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

function pushZodIssues(
  errors: ValidationError[],
  source: string,
  pathPrefix: ReadonlyArray<string | number>,
  error: ZodError,
): void {
  for (const issue of error.issues) {
    errors.push({
      path: [...pathPrefix, ...toValidationPath(issue.path)],
      message: issue.message,
      source,
    });
  }
}

function toValidationPath(pathParts: readonly unknown[]): Array<string | number> {
  return pathParts.filter((part): part is string | number => {
    return typeof part === "string" || typeof part === "number";
  });
}

async function exists(p: string): Promise<boolean> {
  return fs
    .stat(p)
    .then(() => true)
    .catch(() => false);
}
