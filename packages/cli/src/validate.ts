import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { LessonMetaSchema } from "@interactive-learning/protocol";
import YAML from "yaml";

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
      if (e && typeof e === "object" && "issues" in e) {
        const issues = (
          e as { issues: Array<{ path: ReadonlyArray<string | number>; message: string }> }
        ).issues;
        for (const iss of issues) {
          errors.push({ path: iss.path, message: iss.message, source: "meta" });
        }
      } else {
        errors.push({ path: [], message: String(e), source: "meta" });
      }
    }
  }

  if (!(await exists(path.join(lessonDir, "index.mdx")))) {
    errors.push({ path: [], message: "index.mdx missing", source: "mdx" });
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
