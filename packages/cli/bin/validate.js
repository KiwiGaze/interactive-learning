#!/usr/bin/env node
import { validateLesson } from "../dist/validate.js";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: interactive-learning-validate <path>");
  process.exit(2);
}

const result = await validateLesson(dir);
if (!result.ok) {
  for (const e of result.errors) {
    console.error(`x [${e.source}] ${e.path.join(".") || "(root)"}: ${e.message}`);
  }
  process.exit(1);
}
console.log("ok valid");
