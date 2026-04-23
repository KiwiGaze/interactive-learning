import path from "node:path";
import { pathToFileURL } from "node:url";
import { type LessonMeta, LessonMetaSchema } from "@interactive-learning/protocol";

export async function readLessonMeta(lessonDir: string, file = "meta.mjs"): Promise<LessonMeta> {
  const abs = path.resolve(lessonDir, file);
  const mod = (await import(pathToFileURL(abs).href)) as { default?: unknown };
  return LessonMetaSchema.parse(mod.default ?? mod);
}

export function ensureSafeAssetPath(lessonDir: string, asset: string): string {
  const resolved = path.resolve(lessonDir, asset);
  const base = path.resolve(lessonDir) + path.sep;
  if (!resolved.startsWith(base)) throw new Error("PATH_TRAVERSAL: asset escapes lesson dir");
  return resolved;
}
