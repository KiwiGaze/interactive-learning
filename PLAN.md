# Interactive Learning MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Phase 1 MVP of Interactive Learning — an MCP server middleware + browser SPA + 6 component library + Claude Code skill, so local agents (Claude Code / Codex / Cursor) can drive declarative educational UI in a browser with bidirectional user-event feedback.

**Architecture:** Single Node 20+ process running (a) stdio MCP server and (b) Fastify HTTP + `ws` WebSocket on `127.0.0.1:<port>` that share one in-memory `SessionStore`. Browser SPA is a Vite + React 19 + shadcn/ui app that mounts slots via a catalog lookup, emits user events over WS, and renders declaratively from agent-issued `render_component` / `update_component` calls. Course packs are directory-based MDX + Zod-validated `meta.ts` + side-car YAML.

**Tech Stack:** TypeScript (strict) · Node 20 LTS · `@modelcontextprotocol/sdk` · Fastify v5 · `ws` v8 · Zod v4 · Vite v6 · React 19 · Tailwind v4 + shadcn/ui · Radix · `@mdx-js/mdx` + `gray-matter` · `mermaid` v11 · `ts-fsrs` v5 (event hooks only in Phase 1) · Zustand + TanStack Query · Vitest · Playwright · pnpm workspaces · pino.

---

## 0. Pre-decisions assumed

The plan assumes the following defaults for RPD §10 open questions. Revert individual tasks if the user picks differently.

| OQ | Assumed answer |
|---|---|
| OQ-1 | Package namespace `@interactive-learning/*` |
| OQ-2 | Fallback port `7654` |
| OQ-3 | Default course root `~/interactive-learning/courses/` (use `os.homedir()`) |
| OQ-4 | Basic Windows support; use `node:path` and `fs.promises` everywhere |
| OQ-5 | No extra STEM component in v0.1 |
| OQ-6 | Example packs: `python-decorators`, `history-silk-road`, `geometry-triangles` |
| OQ-7 | Skill prose in English; README bilingual (zh-CN + en) |
| OQ-8 | No telemetry |

---

## 1. Task map

### Foundation (prerequisite to both UI and server)

| # | Task | Package(s) |
|---|---|---|
| F.1 | Monorepo scaffold (pnpm + tsconfig + biome) | root |
| F.2 | `@interactive-learning/protocol` — Zod schemas | `packages/protocol` |

### Server-related

| # | Task | Package |
|---|---|---|
| S.1 | MCP server bootstrap (stdio + initialize) | `packages/mcp-server` |
| S.2 | `SessionStore` — slots + ring buffer + cursor | `packages/mcp-server` |
| S.3 | Component catalog registry (server mirror) | `packages/mcp-server` |
| S.4 | Tool `render_component` | `packages/mcp-server` |
| S.5 | Tool `update_component` (RFC 6902) | `packages/mcp-server` |
| S.6 | Tool `wait_for_event` (long polling) | `packages/mcp-server` |
| S.7 | Tool `end_session` | `packages/mcp-server` |
| S.8 | Resource `catalog://components` | `packages/mcp-server` |
| S.9 | Resource `session://current/state` | `packages/mcp-server` |
| S.10 | Prompt `/start_lesson` | `packages/mcp-server` |
| S.11 | Fastify HTTP + static SPA hosting | `packages/mcp-server` |
| S.12 | `ws` WebSocket + broadcast + Origin check | `packages/mcp-server` |
| S.13 | Port allocator (fallback + random + lockfile) | `packages/mcp-server` |
| S.14 | Lazy bring-up + auto `open` browser | `packages/mcp-server` |
| S.15 | Idle timeout + graceful shutdown | `packages/mcp-server` |
| S.16 | Structured JSON-RPC errors + Zod issue mapper | `packages/mcp-server` |
| S.17 | pino logging (stderr-only) + `DEBUG` env | `packages/mcp-server` |
| S.18 | `bin/interactive-learning-mcp` entry + `npx` | `packages/mcp-server` |
| S.19 | Course pack loader (server-side read) | `packages/mcp-server` |
| S.20 | `@interactive-learning/cli` — `validate` | `packages/cli` |

### UI-related

| # | Task | Package |
|---|---|---|
| U.1 | Vite + React 19 scaffold | `packages/ui` |
| U.2 | Tailwind v4 + shadcn/ui init + theme tokens | `packages/ui` |
| U.3 | WS client hook + Zustand store + TanStack Query boot | `packages/ui` |
| U.4 | `<SlotRenderer>` — catalog lookup + ErrorBoundary | `packages/ui` |
| U.5 | Component: `Markdown` (MDX runtime, AST-whitelisted) | `packages/ui` |
| U.6 | Component: `Quiz` | `packages/ui` |
| U.7 | Component: `FlashCard` | `packages/ui` |
| U.8 | Component: `StepByStep` | `packages/ui` |
| U.9 | Component: `Diagram` (Mermaid v11) | `packages/ui` |
| U.10 | Component: `Hint` / `Reveal` | `packages/ui` |
| U.11 | `/closed` session-ended page | `packages/ui` |
| U.12 | Reconnect + reconcile with `session://current/state` | `packages/ui` |
| U.13 | Global `window.onerror` → `session.uncaught_error` | `packages/ui` |

### Integration & delivery (both UI and server involved)

| # | Task | Package |
|---|---|---|
| I.1 | Example course pack: `python-decorators` | `packages/examples` |
| I.2 | Example course pack: `history-silk-road` | `packages/examples` |
| I.3 | Example course pack: `geometry-triangles` | `packages/examples` |
| I.4 | `@interactive-learning/skills` — single-source + Claude Code dist | `packages/skills` |
| I.5 | Playwright E2E — full agent loop | `packages/e2e` |
| I.6 | GitHub Actions CI (Node 20/22 × macOS/Ubuntu) | root |
| I.7 | Top-level README + CONTRIBUTING | root |
| I.8 | Release checklist (Phase 1 v0.1 demo acceptance) | root |

---

## 2. Conventions for all tasks

- **TDD everywhere.** Write the failing test first; run it; implement; rerun; commit.
- **Commits:** conventional commits, scoped by package: `feat(mcp-server): ...`, `test(ui): ...`, `chore(protocol): ...`.
- **Paths:** always absolute or workspace-relative; never `cd`. Use `node:path`.
- **No `any`.** TypeScript strict. Failing typecheck blocks commit.
- **Zod v4 only.** All external I/O validated; no silent coercion.
- **No AI attribution in commits** (per user's global instructions).
- **Test runner:** `pnpm -w test` at root; per-package `pnpm --filter <pkg> test`.

---

# Foundation

## Task F.1 — Monorepo scaffold

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `biome.json`
- Create: `.gitignore`
- Create: `.npmrc`
- Create: `.nvmrc`

- [ ] **Step 1: Initialize the workspace**

Run:
```bash
cd /Users/mac/Desktop/Projects/interactive-learning
git init
pnpm init
```

Write `pnpm-workspace.yaml`:
```yaml
packages:
  - "packages/*"
```

Write `package.json` (root):
```json
{
  "name": "interactive-learning",
  "private": true,
  "version": "0.0.0",
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "pnpm -r --filter './packages/*' build",
    "test": "pnpm -r --filter './packages/*' test",
    "typecheck": "pnpm -r --filter './packages/*' typecheck",
    "lint": "biome check .",
    "format": "biome format --write ."
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

Write `tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "sourceMap": true
  }
}
```

Write `biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true, "suspicious": { "noExplicitAny": "error" } } },
  "organizeImports": { "enabled": true }
}
```

Write `.gitignore`:
```
node_modules
dist
build
coverage
.turbo
.DS_Store
*.log
.env
.env.local
```

Write `.nvmrc`:
```
20
```

Write `.npmrc`:
```
engine-strict=true
auto-install-peers=true
```

- [ ] **Step 2: Create package dirs**

```bash
mkdir -p packages/protocol/src packages/protocol/tests
mkdir -p packages/mcp-server/src packages/mcp-server/tests packages/mcp-server/bin
mkdir -p packages/ui/src packages/ui/tests packages/ui/public
mkdir -p packages/skills/src packages/skills/dist packages/skills/tests
mkdir -p packages/cli/src packages/cli/tests packages/cli/bin
mkdir -p packages/examples
mkdir -p packages/e2e/tests
```

- [ ] **Step 3: Verify workspace resolves**

```bash
pnpm install
pnpm exec tsc -v
pnpm -r list --depth -1
```

Expected: `pnpm -r list` shows no packages yet (no `package.json` in subdirs). `tsc -v` prints 5.6+.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: scaffold pnpm monorepo with tsconfig and biome"
```

---

## Task F.2 — `@interactive-learning/protocol` — shared Zod schemas

This package is the single source of truth for types shared between server and UI. Exports: component catalog interface, event envelope, session state, tool I/O schemas.

**Files:**
- Create: `packages/protocol/package.json`
- Create: `packages/protocol/tsconfig.json`
- Create: `packages/protocol/src/index.ts`
- Create: `packages/protocol/src/events.ts`
- Create: `packages/protocol/src/session.ts`
- Create: `packages/protocol/src/catalog.ts`
- Create: `packages/protocol/src/tools.ts`
- Create: `packages/protocol/src/lesson.ts`
- Create: `packages/protocol/src/components/index.ts` (barrel)
- Create: `packages/protocol/src/components/markdown.ts`
- Create: `packages/protocol/src/components/quiz.ts`
- Create: `packages/protocol/src/components/flashcard.ts`
- Create: `packages/protocol/src/components/step-by-step.ts`
- Create: `packages/protocol/src/components/diagram.ts`
- Create: `packages/protocol/src/components/hint.ts`
- Create: `packages/protocol/tests/events.test.ts`
- Create: `packages/protocol/tests/tools.test.ts`
- Create: `packages/protocol/tests/lesson.test.ts`
- Create: `packages/protocol/tests/components.test.ts`

> **Component-schema SSOT (per RPD FR-MCP-05)**: Every component's `propsSchema` and `eventSchemas` live here — not in `packages/ui` and not in `packages/mcp-server`. Both server (for catalog validation) and UI (for component registration) import from `@interactive-learning/protocol`. React components stay in UI; Zod schemas stay in protocol.

- [ ] **Step 1: Package manifest**

Write `packages/protocol/package.json`:
```json
{
  "name": "@interactive-learning/protocol",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

Write `packages/protocol/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 2: Write failing event schema test**

Write `packages/protocol/tests/events.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { EventEnvelopeSchema, RESERVED_EVENT_PREFIXES } from "../src/events.js";

describe("EventEnvelopeSchema", () => {
  it("accepts a well-formed envelope", () => {
    const parsed = EventEnvelopeSchema.parse({
      event_id: "018f6a1e-0000-7000-8000-000000000001",
      timestamp: 1713800000000,
      slot_id: "slot-1",
      slot_version: 1,
      type: "quiz.answer_submitted",
      payload: { question_id: "q1", value: "b" },
    });
    expect(parsed.type).toBe("quiz.answer_submitted");
  });

  it("rejects missing slot_version (no silent fill)", () => {
    expect(() =>
      EventEnvelopeSchema.parse({
        event_id: "018f6a1e-0000-7000-8000-000000000001",
        timestamp: 1,
        slot_id: "s",
        type: "quiz.foo",
        payload: {},
      } as unknown),
    ).toThrow();
  });

  it("exports reserved prefixes for namespace guarding", () => {
    expect(RESERVED_EVENT_PREFIXES).toEqual(["component.", "session."]);
  });
});
```

Run: `pnpm --filter @interactive-learning/protocol test`. Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `events.ts`**

Write `packages/protocol/src/events.ts`:
```ts
import { z } from "zod";

export const RESERVED_EVENT_PREFIXES = ["component.", "session."] as const;

export const EventEnvelopeSchema = z.object({
  event_id: z.string().uuid(),
  timestamp: z.number().int().nonnegative(),
  slot_id: z.string().min(1),
  slot_version: z.number().int().nonnegative(),
  type: z.string().min(1),
  payload: z.unknown(),
});

export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
```

Run test again. Expected: PASS.

- [ ] **Step 4: Session + slot schemas**

Write `packages/protocol/src/session.ts`:
```ts
import { z } from "zod";

export const SlotStateSchema = z.object({
  slot_id: z.string().min(1),
  version: z.number().int().nonnegative(),
  parent_slot: z.string().optional(),
  type: z.string().min(1),
  props: z.unknown(),
  children: z.array(z.string()).optional(),
});
export type SlotState = z.infer<typeof SlotStateSchema>;

export const SessionSnapshotSchema = z.object({
  id: z.string().min(1),
  started_at: z.number().int().nonnegative(),
  cursor: z.string(),
  browser_connected: z.boolean(),
  last_agent_tool_call: z.number().int().nonnegative(),
  slots: z.array(SlotStateSchema),
  recent_events: z.array(z.object({
    event_id: z.string(),
    timestamp: z.number(),
    slot_id: z.string(),
    slot_version: z.number(),
    type: z.string(),
    payload: z.unknown(),
  })),
});
export type SessionSnapshot = z.infer<typeof SessionSnapshotSchema>;
```

- [ ] **Step 5: Component catalog schema**

Write `packages/protocol/src/catalog.ts`:
```ts
import type { z } from "zod";

export interface ComponentDefinition<Props = unknown> {
  readonly type: string;
  readonly props: z.ZodType<Props>;
  readonly events: Readonly<Record<string, z.ZodType<unknown>>>;
}

export interface ComponentCatalog {
  list(): ReadonlyArray<ComponentDefinition>;
  get(type: string): ComponentDefinition | undefined;
  has(type: string): boolean;
}

export interface ComponentCatalogJson {
  components: Array<{
    type: string;
    props_schema: unknown;
    events: Record<string, unknown>;
  }>;
}
```

- [ ] **Step 6: Write failing tool I/O schema test**

Write `packages/protocol/tests/tools.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  RenderComponentInputSchema,
  UpdateComponentInputSchema,
  WaitForEventInputSchema,
  EndSessionInputSchema,
} from "../src/tools.js";

describe("tool I/O schemas", () => {
  it("render_component accepts optional slot_id", () => {
    expect(() =>
      RenderComponentInputSchema.parse({ type: "Quiz", props: {} }),
    ).not.toThrow();
  });

  it("update_component requires RFC 6902 patch", () => {
    const ok = UpdateComponentInputSchema.parse({
      slot_id: "s1",
      patch: [{ op: "replace", path: "/props/reveal_mode", value: "immediate" }],
    });
    expect(ok.patch[0].op).toBe("replace");
  });

  it("wait_for_event clamps timeout ≤ 30000ms", () => {
    expect(() =>
      WaitForEventInputSchema.parse({ timeout_ms: 30001 }),
    ).toThrow();
  });

  it("end_session accepts empty input", () => {
    expect(EndSessionInputSchema.parse({})).toEqual({});
  });
});
```

- [ ] **Step 7: Implement `tools.ts`**

Write `packages/protocol/src/tools.ts`:
```ts
import { z } from "zod";
import { EventEnvelopeSchema } from "./events.js";

export const JsonPatchOpSchema = z.object({
  op: z.enum(["add", "remove", "replace", "move", "copy", "test"]),
  path: z.string().startsWith("/"),
  value: z.unknown().optional(),
  from: z.string().startsWith("/").optional(),
});
export type JsonPatchOp = z.infer<typeof JsonPatchOpSchema>;

export const RenderComponentInputSchema = z.object({
  slot_id: z.string().min(1).optional(),
  type: z.string().min(1),
  props: z.unknown(),
  replace: z.boolean().optional(),
});
export type RenderComponentInput = z.infer<typeof RenderComponentInputSchema>;

export const RenderComponentOutputSchema = z.object({
  slot_id: z.string(),
  cursor: z.string(),
});

export const UpdateComponentInputSchema = z.object({
  slot_id: z.string().min(1),
  patch: z.array(JsonPatchOpSchema).min(1),
});
export type UpdateComponentInput = z.infer<typeof UpdateComponentInputSchema>;

export const UpdateComponentOutputSchema = z.object({ cursor: z.string() });

export const WaitForEventInputSchema = z.object({
  since_cursor: z.string().optional(),
  timeout_ms: z.number().int().min(0).max(30_000).default(25_000),
});
export type WaitForEventInput = z.infer<typeof WaitForEventInputSchema>;

export const WaitForEventOutputSchema = z.object({
  events: z.array(EventEnvelopeSchema),
  next_cursor: z.string(),
});

export const EndSessionInputSchema = z.object({
  reason: z.string().optional(),
});
```

- [ ] **Step 8: Lesson metadata schema**

Write `packages/protocol/tests/lesson.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { LessonMetaSchema } from "../src/lesson.js";

describe("LessonMetaSchema", () => {
  it("requires id, title, summary, objectives≥1, est_minutes", () => {
    expect(() =>
      LessonMetaSchema.parse({
        id: "py-decorators",
        title: "Python Decorators",
        summary: "Learn @decorator syntax",
        objectives: ["Explain recursion", "Use @staticmethod"],
        est_minutes: 30,
      }),
    ).not.toThrow();
  });

  it("rejects empty objectives", () => {
    expect(() =>
      LessonMetaSchema.parse({
        id: "x", title: "x", summary: "x", objectives: [], est_minutes: 5,
      }),
    ).toThrow();
  });
});
```

Write `packages/protocol/src/lesson.ts`:
```ts
import { z } from "zod";

export const LessonMetaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  objectives: z.array(z.string().min(1)).min(1),
  prereqs: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  est_minutes: z.number().int().positive(),
  language: z.string().default("zh-CN"),
  version: z.string().default("0.1.0"),
  authors: z.array(
    z.object({ name: z.string().min(1), email: z.string().email().optional() }),
  ).default([]),
  agent_hints: z.object({
    teaching_style: z.enum(["socratic", "direct", "example_first"]).optional(),
    suggested_flow: z.array(z.string()).optional(),
    key_moments: z.array(z.string()).optional(),
  }).optional(),
});
export type LessonMeta = z.infer<typeof LessonMetaSchema>;
```

- [ ] **Step 9: Component schemas (SSOT)**

Write one file per MVP component. Both `packages/mcp-server` (catalog validation) and `packages/ui` (component registration) import from here — do NOT redeclare in UI.

Write `packages/protocol/src/components/quiz.ts`:
```ts
import { z } from "zod";

export const QuizPropsSchema = z.object({
  title: z.string().optional(),
  questions: z.array(z.object({
    id: z.string(),
    kind: z.enum(["single_choice", "multi_choice", "short_answer"]),
    prompt: z.string(),
    options: z.array(z.object({
      id: z.string(),
      label: z.string(),
      is_correct: z.boolean().optional(),
    })).optional(),
    correct_answer: z.union([z.string(), z.array(z.string())]).optional(),
    explanation: z.string().optional(),
  })),
  reveal_mode: z.enum(["immediate", "on_submit", "never"]).default("on_submit"),
  allow_retry: z.boolean().default(true),
});
export type QuizProps = z.infer<typeof QuizPropsSchema>;

export const QuizEventSchemas = {
  "quiz.answer_submitted":  z.object({ question_id: z.string(), value: z.unknown() }),
  "quiz.all_submitted":     z.object({ answers: z.record(z.string(), z.unknown()) }),
  "quiz.explanation_shown": z.object({ question_id: z.string() }),
} as const;
```

Write analogous files for `markdown.ts` / `flashcard.ts` / `step-by-step.ts` / `diagram.ts` / `hint.ts` using the Zod shapes from BRAINSTORMING §6.2 verbatim.

Write `packages/protocol/src/components/index.ts`:
```ts
export * from "./markdown.js";
export * from "./quiz.js";
export * from "./flashcard.js";
export * from "./step-by-step.js";
export * from "./diagram.js";
export * from "./hint.js";
```

Write `packages/protocol/tests/components.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { QuizPropsSchema, QuizEventSchemas } from "../src/components/quiz.js";

describe("Quiz schema", () => {
  it("accepts a well-formed quiz", () => {
    expect(() => QuizPropsSchema.parse({
      questions: [{ id: "q1", kind: "single_choice", prompt: "x" }],
    })).not.toThrow();
  });
  it("rejects unknown kind", () => {
    expect(() => QuizPropsSchema.parse({
      questions: [{ id: "q1", kind: "hot_take", prompt: "x" }],
    })).toThrow();
  });
  it("event schema validates payload shape", () => {
    expect(() =>
      QuizEventSchemas["quiz.answer_submitted"].parse({ question_id: "q1", value: "b" }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 10: Barrel export**

Write `packages/protocol/src/index.ts`:
```ts
export * from "./events.js";
export * from "./session.js";
export * from "./catalog.js";
export * from "./tools.js";
export * from "./lesson.js";
export * from "./components/index.js";
```

- [ ] **Step 11: Build + verify**

```bash
pnpm --filter @interactive-learning/protocol install
pnpm --filter @interactive-learning/protocol test
pnpm --filter @interactive-learning/protocol build
```

Expected: all tests PASS, `dist/` created with `.d.ts` files.

- [ ] **Step 12: Commit**

```bash
git add packages/protocol
git commit -m "feat(protocol): shared Zod schemas for events, session, tools, lesson, components"
```

---

# Server-related tasks

## Task S.1 — MCP server bootstrap

Stand up a minimal MCP server on stdio that responds to `initialize` and exposes zero tools. This is the foundation for S.4–S.10.

**Files:**
- Create: `packages/mcp-server/package.json`
- Create: `packages/mcp-server/tsconfig.json`
- Create: `packages/mcp-server/src/server.ts`
- Create: `packages/mcp-server/src/index.ts`
- Create: `packages/mcp-server/tests/initialize.test.ts`

- [ ] **Step 1: Manifest**

Write `packages/mcp-server/package.json`:
```json
{
  "name": "@interactive-learning/mcp-server",
  "version": "0.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "bin": { "interactive-learning-mcp": "./bin/server.js" },
  "files": ["dist", "bin", "spa"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "start": "node ./bin/server.js"
  },
  "dependencies": {
    "@interactive-learning/protocol": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "fastify": "^5.0.0",
    "@fastify/static": "^8.0.0",
    "fast-json-patch": "^3.1.1",
    "open": "^10.1.0",
    "pino": "^9.0.0",
    "uuid": "^11.0.0",
    "ws": "^8.18.0",
    "zod": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/ws": "^8.5.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

Write `packages/mcp-server/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "rootDir": "./src", "outDir": "./dist", "types": ["node"] },
  "include": ["src/**/*"]
}
```

- [ ] **Step 2: Failing initialize test**

Write `packages/mcp-server/tests/initialize.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "../src/server.js";

describe("MCP server initialize", () => {
  it("responds to initialize with server info", async () => {
    const [clientT, serverT] = InMemoryTransport.createLinkedPair();
    const server = buildServer();
    await server.connect(serverT);

    const client = new Client({ name: "test", version: "0" });
    await client.connect(clientT);

    const info = client.getServerVersion();
    expect(info?.name).toBe("interactive-learning");
  });
});
```

Run: `pnpm --filter @interactive-learning/mcp-server test`. Expected: FAIL — `buildServer` not defined.

- [ ] **Step 3: Minimal server**

Write `packages/mcp-server/src/server.ts`:
```ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function buildServer(): Server {
  const server = new Server(
    { name: "interactive-learning", version: "0.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } },
  );
  return server;
}
```

Write `packages/mcp-server/src/index.ts`:
```ts
export { buildServer } from "./server.js";
```

Run test. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-server
git commit -m "feat(mcp-server): stdio MCP server bootstrap responding to initialize"
```

---

## Task S.2 — `SessionStore`: slots + ring buffer + cursor

Pure in-memory data structure. All tools manipulate this. No I/O.

**Files:**
- Create: `packages/mcp-server/src/session-store.ts`
- Create: `packages/mcp-server/src/ring-buffer.ts`
- Create: `packages/mcp-server/tests/session-store.test.ts`
- Create: `packages/mcp-server/tests/ring-buffer.test.ts`

- [ ] **Step 1: Failing ring buffer test**

Write `packages/mcp-server/tests/ring-buffer.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { RingBuffer } from "../src/ring-buffer.js";

describe("RingBuffer", () => {
  it("keeps last N items, evicting oldest", () => {
    const rb = new RingBuffer<number>(3);
    [1, 2, 3, 4].forEach((n) => rb.push(n));
    expect(rb.toArray()).toEqual([2, 3, 4]);
  });

  it("slices items after a given predicate match", () => {
    const rb = new RingBuffer<{ id: string }>(10);
    ["a", "b", "c", "d"].forEach((id) => rb.push({ id }));
    expect(rb.sliceAfter((x) => x.id === "b").map((x) => x.id)).toEqual(["c", "d"]);
  });

  it("returns empty slice when predicate never matches", () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1);
    expect(rb.sliceAfter((x) => x === 99)).toEqual([]);
  });
});
```

- [ ] **Step 2: Implement `RingBuffer`**

Write `packages/mcp-server/src/ring-buffer.ts`:
```ts
export class RingBuffer<T> {
  private readonly items: T[] = [];
  constructor(private readonly capacity: number) {
    if (capacity <= 0) throw new Error("capacity must be positive");
  }
  push(item: T): void {
    this.items.push(item);
    if (this.items.length > this.capacity) this.items.shift();
  }
  toArray(): readonly T[] {
    return this.items.slice();
  }
  sliceAfter(pred: (t: T) => boolean): readonly T[] {
    const idx = this.items.findIndex(pred);
    if (idx < 0) return [];
    return this.items.slice(idx + 1);
  }
  get length(): number {
    return this.items.length;
  }
  last(): T | undefined {
    return this.items[this.items.length - 1];
  }
}
```

Run: test passes.

- [ ] **Step 3: Failing SessionStore test**

Write `packages/mcp-server/tests/session-store.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SessionStore } from "../src/session-store.js";

describe("SessionStore", () => {
  let store: SessionStore;
  beforeEach(() => { store = new SessionStore(); });

  it("renders a new slot with auto-generated id and version=1", () => {
    const { slot_id, cursor } = store.render({ type: "Quiz", props: { questions: [] } });
    expect(slot_id).toMatch(/^slot-/);
    expect(store.getSlot(slot_id)?.version).toBe(1);
    expect(cursor).toBeDefined();
  });

  it("replace=true bumps version and drops in-flight events for that slot", () => {
    const { slot_id } = store.render({ type: "Quiz", props: {} });
    store.recordEvent({ slot_id, slot_version: 1, type: "quiz.x", payload: {} });
    const { cursor } = store.render({ slot_id, type: "Quiz", props: { title: "v2" }, replace: true });
    expect(store.getSlot(slot_id)?.version).toBe(2);
    const tail = store.eventsAfter(cursor);
    expect(tail).toHaveLength(0);
  });

  it("render on existing id without replace returns error", () => {
    const { slot_id } = store.render({ type: "Quiz", props: {} });
    expect(() => store.render({ slot_id, type: "Quiz", props: {} })).toThrow(/INVALID_OPERATION/);
  });

  it("update applies JSON Patch; failure rolls back whole patch AND emits no event", () => {
    const { slot_id } = store.render({ type: "Quiz", props: { title: "a" } });
    const cursorBefore = store.currentCursor();
    store.update({ slot_id, patch: [{ op: "replace", path: "/title", value: "b" }] });
    expect(store.getSlot(slot_id)?.props).toMatchObject({ title: "b" });
    const afterOk = store.currentCursor();
    expect(afterOk).not.toBe(cursorBefore);

    expect(() =>
      store.update({ slot_id, patch: [
        { op: "replace", path: "/title", value: "c" },
        { op: "test", path: "/nonexistent", value: 1 },
      ] }),
    ).toThrow();
    expect(store.getSlot(slot_id)?.props).toMatchObject({ title: "b" });
    // Failed update must not emit a `component.updated` event nor advance cursor.
    expect(store.currentCursor()).toBe(afterOk);
  });

  it("update runs validator before commit; validator rejection emits no event", () => {
    const { slot_id } = store.render({ type: "Quiz", props: { title: "a" } });
    const cursorBefore = store.currentCursor();
    const reject = () => { throw new Error("ZOD_FAIL: bad props"); };
    expect(() =>
      store.update({ slot_id, patch: [{ op: "replace", path: "/title", value: "b" }] }, reject),
    ).toThrow(/ZOD_FAIL/);
    expect(store.getSlot(slot_id)?.props).toMatchObject({ title: "a" });
    expect(store.currentCursor()).toBe(cursorBefore);
  });

  it("cursor advances monotonically; events never missed", () => {
    const start = store.currentCursor();
    const a = store.recordEvent({ slot_id: "s", slot_version: 1, type: "e.a", payload: {} });
    const b = store.recordEvent({ slot_id: "s", slot_version: 1, type: "e.b", payload: {} });
    expect(a.event_id < b.event_id).toBe(true);
    expect(store.eventsAfter(start).map((e) => e.type)).toEqual(["e.a", "e.b"]);
  });

  it("ring buffer capacity = 1000", () => {
    for (let i = 0; i < 1005; i++) {
      store.recordEvent({ slot_id: "s", slot_version: 1, type: "e.x", payload: i });
    }
    expect(store.eventCount()).toBe(1000);
  });

  it("eventsAfter returns CURSOR_EXPIRED when cursor was evicted", () => {
    const firstCursor = store.recordEvent({ slot_id: "s", slot_version: 1, type: "e.x", payload: 0 }).event_id;
    for (let i = 0; i < 1005; i++) {
      store.recordEvent({ slot_id: "s", slot_version: 1, type: "e.x", payload: i + 1 });
    }
    expect(() => store.eventsAfter(firstCursor)).toThrow(/CURSOR_EXPIRED/);
  });

  it("eventsAfter with unknown-but-not-evicted cursor also returns CURSOR_EXPIRED", () => {
    expect(() => store.eventsAfter("018f0000-0000-7000-8000-000000000000")).toThrow(/CURSOR_EXPIRED/);
  });
});
```

- [ ] **Step 4: Implement `SessionStore`**

Write `packages/mcp-server/src/session-store.ts`:
```ts
import { v7 as uuidv7 } from "uuid";
import jsonpatch from "fast-json-patch";
import type { EventEnvelope, SlotState } from "@interactive-learning/protocol";
import { RingBuffer } from "./ring-buffer.js";

export interface RenderArgs {
  slot_id?: string;
  type: string;
  props: unknown;
  replace?: boolean;
  parent_slot?: string;
}

export interface UpdateArgs {
  slot_id: string;
  patch: ReadonlyArray<jsonpatch.Operation>;
}

type EventInput = Omit<EventEnvelope, "event_id" | "timestamp">;

type Subscriber = (e: EventEnvelope) => void;

export class SessionStore {
  private readonly slots = new Map<string, SlotState>();
  private readonly events = new RingBuffer<EventEnvelope>(1000);
  private cursor = "";
  private slotSeq = 0;
  private readonly subscribers = new Set<Subscriber>();
  readonly startedAt = Date.now();
  readonly id = uuidv7();
  lastAgentToolCall = Date.now();
  browserConnected = false;

  render(args: RenderArgs): { slot_id: string; cursor: string } {
    this.lastAgentToolCall = Date.now();
    const existing = args.slot_id ? this.slots.get(args.slot_id) : undefined;

    if (args.slot_id && existing && !args.replace) {
      const err = new Error("INVALID_OPERATION: slot exists; use update_component or set replace=true");
      (err as { code?: string }).code = "INVALID_OPERATION";
      throw err;
    }

    const slot_id = args.slot_id ?? this.nextSlotId();
    const version = existing ? existing.version + 1 : 1;
    const slot: SlotState = {
      slot_id,
      version,
      type: args.type,
      props: args.props,
      ...(args.parent_slot ? { parent_slot: args.parent_slot } : {}),
    };
    this.slots.set(slot_id, slot);
    const ev = this.recordEvent({
      slot_id,
      slot_version: version,
      type: "component.rendered",
      payload: { replaced: Boolean(existing) },
    });
    return { slot_id, cursor: ev.event_id };
  }

  update(
    args: UpdateArgs,
    validateProps?: (type: string, props: unknown) => void,
  ): { cursor: string } {
    this.lastAgentToolCall = Date.now();
    const slot = this.slots.get(args.slot_id);
    if (!slot) {
      const err = new Error("NOT_FOUND: slot not found");
      (err as { code?: string }).code = "NOT_FOUND";
      throw err;
    }

    // Phase 1: compute + validate. No state mutation, no event, no cursor advance.
    let next: unknown;
    try {
      next = jsonpatch.applyPatch(
        structuredClone(slot.props),
        args.patch as jsonpatch.Operation[],
        /*validate*/ true,
        /*mutate*/ false,
      ).newDocument;
    } catch (cause) {
      const err = new Error("INVALID_PATCH: " + (cause instanceof Error ? cause.message : String(cause)));
      (err as { code?: string }).code = "INVALID_PATCH";
      throw err;
    }
    if (validateProps) validateProps(slot.type, next); // Zod throws; no state touched yet.

    // Phase 2: commit atomically — mutate state, emit event, advance cursor together.
    slot.props = next;
    const ev = this.recordEvent({
      slot_id: args.slot_id,
      slot_version: slot.version,
      type: "component.updated",
      payload: {},
    });
    return { cursor: ev.event_id };
  }

  recordEvent(input: EventInput): EventEnvelope {
    const event: EventEnvelope = {
      event_id: uuidv7(),
      timestamp: Date.now(),
      ...input,
    };
    this.events.push(event);
    this.cursor = event.event_id;
    for (const s of this.subscribers) s(event);
    return event;
  }

  eventsAfter(since: string | undefined): readonly EventEnvelope[] {
    if (!since) return this.events.toArray();
    const arr = this.events.toArray();
    const idx = arr.findIndex((e) => e.event_id === since);
    if (idx < 0) {
      const err = new Error(
        "CURSOR_EXPIRED: cursor not in ring buffer; re-read session://current/state to reconcile",
      );
      (err as { code?: string }).code = "CURSOR_EXPIRED";
      throw err;
    }
    return arr.slice(idx + 1);
  }

  currentCursor(): string {
    return this.cursor;
  }

  getSlot(id: string): SlotState | undefined {
    return this.slots.get(id);
  }

  listSlots(): readonly SlotState[] {
    return [...this.slots.values()];
  }

  eventCount(): number {
    return this.events.length;
  }

  onEvent(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  snapshot(): {
    id: string;
    started_at: number;
    cursor: string;
    browser_connected: boolean;
    last_agent_tool_call: number;
    slots: readonly SlotState[];
    recent_events: readonly EventEnvelope[];
  } {
    return {
      id: this.id,
      started_at: this.startedAt,
      cursor: this.cursor,
      browser_connected: this.browserConnected,
      last_agent_tool_call: this.lastAgentToolCall,
      slots: this.listSlots(),
      recent_events: this.events.toArray(),
    };
  }

  private nextSlotId(): string {
    this.slotSeq += 1;
    return `slot-${this.slotSeq}`;
  }
}
```

Run: `pnpm --filter @interactive-learning/mcp-server test`. Expected: PASS on all 6 assertions.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server
git commit -m "feat(mcp-server): SessionStore with slots, ring buffer, monotonic cursor"
```

---

## Task S.3 — Component catalog registry (server mirror)

Server needs a registry to validate props against component schemas. Per F.2 Step 9, **the authoritative Zod schemas live in `@interactive-learning/protocol/components/*`**; the server imports them directly. Task U.4 / U.5–U.10 import from the same place. No UI→server dependency, no server→UI dependency.

**Files:**
- Create: `packages/mcp-server/src/catalog.ts`
- Create: `packages/mcp-server/tests/catalog.test.ts`
- Modify: `packages/protocol/src/catalog.ts` (already done in F.2; add no-op note)

We implement the server-side `CatalogRegistry`. Schemas are registered via `registerDefaultCatalog(reg)` in Task S.18 by importing from `@interactive-learning/protocol`.

- [ ] **Step 1: Failing catalog registry test**

Write `packages/mcp-server/tests/catalog.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { CatalogRegistry } from "../src/catalog.js";
import { RESERVED_EVENT_PREFIXES } from "@interactive-learning/protocol";

describe("CatalogRegistry", () => {
  it("validates props against registered schema", () => {
    const reg = new CatalogRegistry();
    reg.register({
      type: "Quiz",
      props: z.object({ title: z.string() }),
      events: { "quiz.answered": z.object({ question_id: z.string() }) },
    });
    expect(() => reg.validateProps("Quiz", { title: "hi" })).not.toThrow();
    expect(() => reg.validateProps("Quiz", { title: 1 })).toThrow();
  });

  it("rejects unknown component type", () => {
    const reg = new CatalogRegistry();
    expect(() => reg.validateProps("Unknown", {})).toThrow(/UNKNOWN_COMPONENT/);
  });

  it("throws at registration if event names use reserved prefix", () => {
    const reg = new CatalogRegistry();
    expect(() =>
      reg.register({
        type: "X",
        props: z.object({}),
        events: { "component.illegal": z.object({}) },
      }),
    ).toThrow(/RESERVED_NAMESPACE/);
    expect(RESERVED_EVENT_PREFIXES.length).toBeGreaterThan(0);
  });

  it("serializes to JSON schema for catalog resource", () => {
    const reg = new CatalogRegistry();
    reg.register({ type: "Quiz", props: z.object({ title: z.string() }), events: {} });
    const json = reg.toJson();
    expect(json.components[0].type).toBe("Quiz");
    expect(json.components[0].props_schema).toBeDefined();
  });
});
```

- [ ] **Step 2: Implement `CatalogRegistry`**

Write `packages/mcp-server/src/catalog.ts`:
```ts
import { z } from "zod";
import {
  RESERVED_EVENT_PREFIXES,
  type ComponentCatalog,
  type ComponentCatalogJson,
  type ComponentDefinition,
} from "@interactive-learning/protocol";

export class CatalogRegistry implements ComponentCatalog {
  private readonly defs = new Map<string, ComponentDefinition>();

  register(def: ComponentDefinition): void {
    for (const evName of Object.keys(def.events)) {
      for (const prefix of RESERVED_EVENT_PREFIXES) {
        if (evName.startsWith(prefix)) {
          throw new Error(`RESERVED_NAMESPACE: event "${evName}" uses reserved prefix "${prefix}"`);
        }
      }
    }
    if (this.defs.has(def.type)) throw new Error(`DUPLICATE_COMPONENT: ${def.type}`);
    this.defs.set(def.type, def);
  }

  has(type: string): boolean {
    return this.defs.has(type);
  }

  get(type: string): ComponentDefinition | undefined {
    return this.defs.get(type);
  }

  list(): ReadonlyArray<ComponentDefinition> {
    return [...this.defs.values()];
  }

  validateProps(type: string, props: unknown): unknown {
    const def = this.defs.get(type);
    if (!def) {
      const err = new Error(`UNKNOWN_COMPONENT: ${type}`);
      (err as { code?: string }).code = "UNKNOWN_COMPONENT";
      throw err;
    }
    return def.props.parse(props);
  }

  toJson(): ComponentCatalogJson {
    return {
      components: this.list().map((c) => ({
        type: c.type,
        props_schema: z.toJSONSchema(c.props),
        events: Object.fromEntries(
          Object.entries(c.events).map(([k, v]) => [k, z.toJSONSchema(v)]),
        ),
      })),
    };
  }
}
```

Run tests. Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/mcp-server
git commit -m "feat(mcp-server): CatalogRegistry with reserved-namespace guard + JSON export"
```

---

## Task S.4 — Tool `render_component`

Wires `SessionStore.render` + `CatalogRegistry.validateProps` into an MCP tool.

**Files:**
- Create: `packages/mcp-server/src/tools/render-component.ts`
- Create: `packages/mcp-server/tests/tools/render-component.test.ts`
- Modify: `packages/mcp-server/src/server.ts` (register tool)

- [ ] **Step 1: Failing test**

Write `packages/mcp-server/tests/tools/render-component.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { SessionStore } from "../../src/session-store.js";
import { CatalogRegistry } from "../../src/catalog.js";
import { renderComponentHandler } from "../../src/tools/render-component.js";

describe("render_component handler", () => {
  let store: SessionStore;
  let catalog: CatalogRegistry;

  beforeEach(() => {
    store = new SessionStore();
    catalog = new CatalogRegistry();
    catalog.register({
      type: "Quiz",
      props: z.object({ questions: z.array(z.object({ id: z.string() })) }),
      events: {},
    });
  });

  it("returns slot_id + cursor on new render", async () => {
    const out = await renderComponentHandler({ store, catalog, input: {
      type: "Quiz", props: { questions: [{ id: "q1" }] },
    }});
    expect(out.slot_id).toMatch(/^slot-/);
    expect(out.cursor).toBeDefined();
  });

  it("surfaces UNKNOWN_COMPONENT as InvalidParams", async () => {
    await expect(renderComponentHandler({ store, catalog, input: {
      type: "Nope", props: {},
    }})).rejects.toMatchObject({ code: -32602 });
  });

  it("replace=true increments version", async () => {
    const { slot_id } = await renderComponentHandler({ store, catalog, input: {
      type: "Quiz", props: { questions: [] },
    }});
    await renderComponentHandler({ store, catalog, input: {
      slot_id, type: "Quiz", props: { questions: [] }, replace: true,
    }});
    expect(store.getSlot(slot_id)?.version).toBe(2);
  });
});
```

- [ ] **Step 2: Implement handler**

Write `packages/mcp-server/src/tools/render-component.ts`:
```ts
import { RenderComponentInputSchema } from "@interactive-learning/protocol";
import type { z as Z } from "zod";
import type { SessionStore } from "../session-store.js";
import type { CatalogRegistry } from "../catalog.js";
import { toJsonRpcError } from "../errors.js";

export async function renderComponentHandler(deps: {
  store: SessionStore;
  catalog: CatalogRegistry;
  input: Z.input<typeof RenderComponentInputSchema>;
}): Promise<{ slot_id: string; cursor: string }> {
  const { store, catalog } = deps;
  const parsed = RenderComponentInputSchema.parse(deps.input);
  const validatedProps = (() => {
    try {
      return catalog.validateProps(parsed.type, parsed.props);
    } catch (cause) {
      throw toJsonRpcError(cause, { component: parsed.type });
    }
  })();
  try {
    const args: Parameters<SessionStore["render"]>[0] = {
      type: parsed.type,
      props: validatedProps,
    };
    if (parsed.slot_id !== undefined) args.slot_id = parsed.slot_id;
    if (parsed.replace !== undefined) args.replace = parsed.replace;
    return store.render(args);
  } catch (cause) {
    throw toJsonRpcError(cause);
  }
}
```

`errors.ts` is implemented in **Task S.16** — for now stub it:
```ts
// packages/mcp-server/src/errors.ts (stub for S.4; full impl in S.16)
export function toJsonRpcError(cause: unknown, extra?: Record<string, unknown>) {
  const err = new Error(cause instanceof Error ? cause.message : String(cause));
  (err as { code?: number }).code = -32602;
  (err as { data?: unknown }).data = { cause: String(cause), ...extra };
  return err;
}
```

Run tests. Expected: PASS.

- [ ] **Step 3: Register on server**

Modify `packages/mcp-server/src/server.ts`:
```ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SetLevelRequestSchema, CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { RenderComponentInputSchema } from "@interactive-learning/protocol";
import { SessionStore } from "./session-store.js";
import { CatalogRegistry } from "./catalog.js";
import { renderComponentHandler } from "./tools/render-component.js";

export interface BuildServerOptions {
  store?: SessionStore;
  catalog?: CatalogRegistry;
}

export function buildServer(opts: BuildServerOptions = {}): {
  server: Server;
  store: SessionStore;
  catalog: CatalogRegistry;
} {
  const store = opts.store ?? new SessionStore();
  const catalog = opts.catalog ?? new CatalogRegistry();
  const server = new Server(
    { name: "interactive-learning", version: "0.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "render_component",
        description: "Render a semantic component in a slot (new, replace, or reject duplicate).",
        inputSchema: z.toJSONSchema(RenderComponentInputSchema),
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    switch (req.params.name) {
      case "render_component": {
        const out = await renderComponentHandler({ store, catalog, input: req.params.arguments ?? {} });
        return { content: [{ type: "text", text: JSON.stringify(out) }] };
      }
      default:
        throw new Error(`UNKNOWN_TOOL: ${req.params.name}`);
    }
  });

  return { server, store, catalog };
}
```

> Update `index.ts` and existing `initialize.test.ts` accordingly: `buildServer()` now returns `{ server, store, catalog }`.

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-server
git commit -m "feat(mcp-server): render_component tool with props validation"
```

---

## Task S.5 — Tool `update_component`

**Files:**
- Create: `packages/mcp-server/src/tools/update-component.ts`
- Create: `packages/mcp-server/tests/tools/update-component.test.ts`
- Modify: `packages/mcp-server/src/server.ts`

- [ ] **Step 1: Failing test**

Write `packages/mcp-server/tests/tools/update-component.test.ts`:
```ts
import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import { SessionStore } from "../../src/session-store.js";
import { CatalogRegistry } from "../../src/catalog.js";
import { updateComponentHandler } from "../../src/tools/update-component.js";

describe("update_component handler", () => {
  let store: SessionStore;
  let catalog: CatalogRegistry;

  beforeEach(() => {
    store = new SessionStore();
    catalog = new CatalogRegistry();
    catalog.register({
      type: "Quiz",
      props: z.object({ title: z.string().optional(), reveal_mode: z.enum(["immediate","on_submit"]).optional() }),
      events: {},
    });
  });

  it("applies a valid replace patch", async () => {
    const { slot_id } = store.render({ type: "Quiz", props: { title: "a" } });
    const out = await updateComponentHandler({ store, catalog, input: {
      slot_id, patch: [{ op: "replace", path: "/title", value: "b" }],
    }});
    expect(out.cursor).toBeDefined();
    expect(store.getSlot(slot_id)?.props).toMatchObject({ title: "b" });
  });

  it("rolls back on schema violation — props unchanged, no event, cursor unchanged", async () => {
    const { slot_id } = store.render({ type: "Quiz", props: { title: "a" } });
    const cursorBefore = store.currentCursor();
    const eventsBefore = store.eventCount();
    await expect(updateComponentHandler({ store, catalog, input: {
      slot_id, patch: [{ op: "replace", path: "/reveal_mode", value: "bogus" }],
    }})).rejects.toBeDefined();
    expect(store.getSlot(slot_id)?.props).toMatchObject({ title: "a" });
    expect(store.currentCursor()).toBe(cursorBefore);
    expect(store.eventCount()).toBe(eventsBefore);
  });
});
```

- [ ] **Step 2: Implement**

Write `packages/mcp-server/src/tools/update-component.ts`:
```ts
import { UpdateComponentInputSchema } from "@interactive-learning/protocol";
import type { z as Z } from "zod";
import type { SessionStore } from "../session-store.js";
import type { CatalogRegistry } from "../catalog.js";
import { toJsonRpcError } from "../errors.js";

export async function updateComponentHandler(deps: {
  store: SessionStore;
  catalog: CatalogRegistry;
  input: Z.input<typeof UpdateComponentInputSchema>;
}): Promise<{ cursor: string }> {
  const { store, catalog } = deps;
  const parsed = UpdateComponentInputSchema.parse(deps.input);
  const slot = store.getSlot(parsed.slot_id);
  if (!slot) throw toJsonRpcError(new Error(`NOT_FOUND: ${parsed.slot_id}`));

  try {
    // Pass catalog validator so the store can check the patched props BEFORE
    // committing state, recording `component.updated`, or advancing the cursor.
    // This guarantees: patch-fail OR schema-fail → zero observable side effects.
    const res = store.update(parsed, (type, next) => catalog.validateProps(type, next));
    return { cursor: res.cursor };
  } catch (cause) {
    throw toJsonRpcError(cause, { component: slot.type, slot_id: parsed.slot_id });
  }
}
```

- [ ] **Step 3: Register + commit**

Add to `server.ts` `ListToolsRequestSchema` and `CallToolRequestSchema` switch. Run tests.

```bash
git add packages/mcp-server
git commit -m "feat(mcp-server): update_component tool with JSON Patch rollback"
```

---

## Task S.6 — Tool `wait_for_event` (long polling)

**Files:**
- Create: `packages/mcp-server/src/tools/wait-for-event.ts`
- Create: `packages/mcp-server/tests/tools/wait-for-event.test.ts`
- Modify: `packages/mcp-server/src/server.ts`

- [ ] **Step 1: Failing test**

Write `packages/mcp-server/tests/tools/wait-for-event.test.ts`:
```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SessionStore } from "../../src/session-store.js";
import { waitForEventHandler } from "../../src/tools/wait-for-event.js";

describe("wait_for_event handler", () => {
  let store: SessionStore;
  beforeEach(() => { store = new SessionStore(); });

  it("returns immediately if events already exist after cursor", async () => {
    store.recordEvent({ slot_id: "s", slot_version: 1, type: "quiz.x", payload: {} });
    const since = "";
    const out = await waitForEventHandler({ store, input: { since_cursor: since, timeout_ms: 100 } });
    expect(out.events.length).toBeGreaterThan(0);
    expect(out.next_cursor).toBe(out.events.at(-1)!.event_id);
  });

  it("blocks until an event is recorded, then returns", async () => {
    const p = waitForEventHandler({ store, input: { timeout_ms: 500 } });
    setTimeout(() => {
      store.recordEvent({ slot_id: "s", slot_version: 1, type: "quiz.y", payload: {} });
    }, 50);
    const out = await p;
    expect(out.events).toHaveLength(1);
  });

  it("returns empty events and unchanged cursor on timeout", async () => {
    const before = store.currentCursor();
    const out = await waitForEventHandler({ store, input: { since_cursor: before, timeout_ms: 50 } });
    expect(out.events).toEqual([]);
    expect(out.next_cursor).toBe(before);
  });

  it("clamps timeout to ≤ 30000ms via schema", async () => {
    await expect(
      waitForEventHandler({ store, input: { timeout_ms: 31_000 } as Z.input<typeof WaitForEventInputSchema> }),
    ).rejects.toBeDefined();
  });

  it("surfaces CURSOR_EXPIRED as JSON-RPC error when cursor is unknown", async () => {
    await expect(
      waitForEventHandler({ store, input: { since_cursor: "018f-stale-cursor", timeout_ms: 50 } }),
    ).rejects.toMatchObject({ code: "CURSOR_EXPIRED" });
  });
});
```

- [ ] **Step 2: Implement**

Write `packages/mcp-server/src/tools/wait-for-event.ts`:
```ts
import { WaitForEventInputSchema, type EventEnvelope } from "@interactive-learning/protocol";
import type { z as Z } from "zod";
import type { SessionStore } from "../session-store.js";
import { toJsonRpcError } from "../errors.js";

function sliceOrThrow(store: SessionStore, since: string | undefined): readonly EventEnvelope[] {
  try {
    return store.eventsAfter(since);
  } catch (cause) {
    if ((cause as { code?: string }).code === "CURSOR_EXPIRED") throw toJsonRpcError(cause);
    throw cause;
  }
}

export async function waitForEventHandler(deps: {
  store: SessionStore;
  input: Z.input<typeof WaitForEventInputSchema>;
}): Promise<{ events: readonly EventEnvelope[]; next_cursor: string }> {
  const { store } = deps;
  const parsed = WaitForEventInputSchema.parse(deps.input);
  const { since_cursor, timeout_ms } = parsed;

  const immediate = sliceOrThrow(store, since_cursor);
  if (immediate.length > 0) {
    return { events: immediate, next_cursor: immediate.at(-1)!.event_id };
  }

  return await new Promise((resolve, reject) => {
    const unsub = store.onEvent(() => {
      try {
        const slice = sliceOrThrow(store, since_cursor);
        if (slice.length > 0) {
          clearTimeout(t);
          unsub();
          resolve({ events: slice, next_cursor: slice.at(-1)!.event_id });
        }
      } catch (err) {
        clearTimeout(t);
        unsub();
        reject(err);
      }
    });
    const t = setTimeout(() => {
      unsub();
      resolve({ events: [], next_cursor: since_cursor ?? store.currentCursor() });
    }, timeout_ms);
  });
}
```

> **Rationale**: An unknown / evicted `since_cursor` must surface as a structured `CURSOR_EXPIRED` JSON-RPC error (RPD FR-MCP-04), not silently degrade to "no events". The skill teaches the agent that on `CURSOR_EXPIRED` it should `read_resource session://current/state` and resume from the snapshot's `cursor`.

- [ ] **Step 3: Register + commit**

```bash
git add packages/mcp-server
git commit -m "feat(mcp-server): wait_for_event long polling with 30s upper bound"
```

---

## Task S.7 — Tool `end_session`

**Files:**
- Create: `packages/mcp-server/src/tools/end-session.ts`
- Create: `packages/mcp-server/tests/tools/end-session.test.ts`
- Modify: `packages/mcp-server/src/server.ts`

- [ ] **Step 1: Failing test**

```ts
// packages/mcp-server/tests/tools/end-session.test.ts
import { describe, it, expect } from "vitest";
import { SessionStore } from "../../src/session-store.js";
import { endSessionHandler } from "../../src/tools/end-session.js";

describe("end_session", () => {
  it("emits session.ended event with reason", async () => {
    const store = new SessionStore();
    const before = store.currentCursor();
    const out = await endSessionHandler({ store, input: { reason: "done" } });
    expect(out).toEqual({});
    const evs = store.eventsAfter(before);
    expect(evs.map((e) => e.type)).toContain("session.ended");
    expect(evs.find((e) => e.type === "session.ended")!.payload).toMatchObject({ reason: "done" });
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/tools/end-session.ts
import { EndSessionInputSchema } from "@interactive-learning/protocol";
import type { z as Z } from "zod";
import type { SessionStore } from "../session-store.js";

export async function endSessionHandler(deps: {
  store: SessionStore;
  input: Z.input<typeof EndSessionInputSchema>;
}): Promise<Record<string, never>> {
  const parsed = EndSessionInputSchema.parse(deps.input);
  deps.store.recordEvent({
    slot_id: "__session__",
    slot_version: 0,
    type: "session.ended",
    payload: { reason: parsed.reason ?? "" },
  });
  return {};
}
```

- [ ] **Step 3: Register + commit**

```bash
git add packages/mcp-server
git commit -m "feat(mcp-server): end_session tool emits session.ended"
```

---

## Task S.8 — Resource `catalog://components`

**Files:**
- Create: `packages/mcp-server/src/resources/catalog.ts`
- Create: `packages/mcp-server/tests/resources/catalog.test.ts`
- Modify: `packages/mcp-server/src/server.ts`

- [ ] **Step 1: Test**

```ts
// packages/mcp-server/tests/resources/catalog.test.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { CatalogRegistry } from "../../src/catalog.js";
import { readCatalogResource } from "../../src/resources/catalog.js";

describe("catalog://components", () => {
  it("returns JSON Schema for all registered components", async () => {
    const reg = new CatalogRegistry();
    reg.register({ type: "Quiz", props: z.object({ title: z.string() }), events: {} });
    const out = await readCatalogResource({ catalog: reg });
    const body = JSON.parse(out.contents[0].text);
    expect(body.components[0].type).toBe("Quiz");
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/resources/catalog.ts
import type { CatalogRegistry } from "../catalog.js";

export async function readCatalogResource(deps: { catalog: CatalogRegistry }) {
  return {
    contents: [{
      uri: "catalog://components",
      mimeType: "application/json",
      text: JSON.stringify(deps.catalog.toJson(), null, 2),
    }],
  };
}
```

- [ ] **Step 3: Register via `ListResourcesRequestSchema` + `ReadResourceRequestSchema`**

Add to `server.ts`:
```ts
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    { uri: "catalog://components", name: "Component catalog", mimeType: "application/json" },
    { uri: "session://current/state", name: "Current session snapshot", mimeType: "application/json" },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
  switch (req.params.uri) {
    case "catalog://components":
      return readCatalogResource({ catalog });
    case "session://current/state":
      return readSessionStateResource({ store });
    default:
      throw new Error(`UNKNOWN_RESOURCE: ${req.params.uri}`);
  }
});
```

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(mcp-server): catalog://components resource"
```

---

## Task S.9 — Resource `session://current/state`

**Files:**
- Create: `packages/mcp-server/src/resources/session-state.ts`
- Create: `packages/mcp-server/tests/resources/session-state.test.ts`

- [ ] **Step 1: Test**

```ts
// packages/mcp-server/tests/resources/session-state.test.ts
import { describe, it, expect } from "vitest";
import { SessionStore } from "../../src/session-store.js";
import { readSessionStateResource } from "../../src/resources/session-state.js";
import { SessionSnapshotSchema } from "@interactive-learning/protocol";

describe("session://current/state", () => {
  it("returns a Snapshot conforming to SessionSnapshotSchema", async () => {
    const store = new SessionStore();
    store.render({ type: "Quiz", props: {} });
    const out = await readSessionStateResource({ store });
    const body = JSON.parse(out.contents[0].text);
    expect(() => SessionSnapshotSchema.parse(body)).not.toThrow();
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/resources/session-state.ts
import type { SessionStore } from "../session-store.js";

export async function readSessionStateResource(deps: { store: SessionStore }) {
  return {
    contents: [{
      uri: "session://current/state",
      mimeType: "application/json",
      text: JSON.stringify(deps.store.snapshot(), null, 2),
    }],
  };
}
```

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(mcp-server): session://current/state resource"
```

---

## Task S.10 — Prompt `/start_lesson`

**Files:**
- Create: `packages/mcp-server/src/prompts/start-lesson.ts`
- Create: `packages/mcp-server/tests/prompts/start-lesson.test.ts`

- [ ] **Step 1: Test**

```ts
// packages/mcp-server/tests/prompts/start-lesson.test.ts
import { describe, it, expect } from "vitest";
import { startLessonPrompt, START_LESSON_PROMPT } from "../../src/prompts/start-lesson.js";

describe("/start_lesson prompt", () => {
  it("references meta.ts, index.mdx, and catalog", () => {
    const out = startLessonPrompt({ path: "~/courses/decorators" });
    expect(out.messages[0].content.text).toMatch(/meta\.ts/);
    expect(out.messages[0].content.text).toMatch(/index\.mdx/);
    expect(out.messages[0].content.text).toMatch(/catalog:\/\/components/);
    expect(out.messages[0].content.text).toMatch(/~\/courses\/decorators/);
  });

  it("exposes the literal prompt name for registration", () => {
    expect(START_LESSON_PROMPT.name).toBe("start_lesson");
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/prompts/start-lesson.ts
export const START_LESSON_PROMPT = {
  name: "start_lesson",
  description: "Load and begin a local course pack.",
  arguments: [{ name: "path", description: "Absolute or ~ path to lesson dir", required: true }],
} as const;

export function startLessonPrompt(args: { path: string }) {
  return {
    messages: [{
      role: "user" as const,
      content: {
        type: "text" as const,
        text: [
          `You will teach the user interactively using the lesson at "${args.path}".`,
          "",
          "Steps (do not skip):",
          `1. Read ${args.path}/meta.ts (LessonMeta schema).`,
          `2. Read ${args.path}/index.mdx.`,
          "3. Read any YAML side-cars (quiz.yaml / flashcards.yaml) referenced by the MDX.",
          "4. Read the resource catalog://components once, cache in session.",
          "5. Call render_component to display the first screen from the lesson.",
          "6. Enter the event loop: wait_for_event(timeout_ms: 25000) -> handle events -> render/update.",
          "",
          "Constraints:",
          "- Never block longer than 25s in a single tool call.",
          "- Never re-read catalog://components inside the loop.",
          "- Never invent component types not in the catalog.",
        ].join("\n"),
      },
    }],
  };
}
```

- [ ] **Step 3: Register + commit**

Add to `server.ts`:
```ts
import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { START_LESSON_PROMPT, startLessonPrompt } from "./prompts/start-lesson.js";

server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: [START_LESSON_PROMPT] }));
server.setRequestHandler(GetPromptRequestSchema, async (req) => {
  if (req.params.name !== "start_lesson") throw new Error("UNKNOWN_PROMPT");
  const path = String(req.params.arguments?.path ?? "");
  if (!path) throw new Error("MISSING_ARG: path");
  return startLessonPrompt({ path });
});
```

```bash
git commit -am "feat(mcp-server): /start_lesson prompt"
```

---

## Task S.11 — Fastify HTTP + static SPA hosting

Server serves the UI SPA bundle built by `packages/ui` (copied into `packages/mcp-server/spa/` at build time).

**Files:**
- Create: `packages/mcp-server/src/http.ts`
- Create: `packages/mcp-server/tests/http.test.ts`

- [ ] **Step 1: Test**

```ts
// packages/mcp-server/tests/http.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { buildHttpServer } from "../src/http.js";
import { SessionStore } from "../src/session-store.js";
import { CatalogRegistry } from "../src/catalog.js";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

describe("HTTP server", () => {
  let close: (() => Promise<void>) | null = null;
  afterEach(async () => { if (close) await close(); close = null; });

  it("serves index.html at /", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(path.join(tmp, "index.html"), "<html>OK</html>");
    const { fastify, port } = await buildHttpServer({
      store: new SessionStore(),
      catalog: new CatalogRegistry(),
      spaDir: tmp,
      port: 0,
    });
    close = async () => { await fastify.close(); };
    const res = await fetch(`http://127.0.0.1:${port}/`);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("OK");
  });

  it("binds to 127.0.0.1 only (no 0.0.0.0)", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(path.join(tmp, "index.html"), "ok");
    const { fastify, port } = await buildHttpServer({
      store: new SessionStore(),
      catalog: new CatalogRegistry(),
      spaDir: tmp,
      port: 0,
    });
    close = async () => { await fastify.close(); };
    const address = fastify.server.address();
    expect(typeof address === "object" && address ? address.address : "").toBe("127.0.0.1");
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/http.ts
import Fastify, { type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import type { SessionStore } from "./session-store.js";
import type { CatalogRegistry } from "./catalog.js";

export interface HttpServerDeps {
  store: SessionStore;
  catalog: CatalogRegistry;
  spaDir: string;
  port: number;
}

export async function buildHttpServer(deps: HttpServerDeps): Promise<{
  fastify: FastifyInstance;
  port: number;
}> {
  const fastify = Fastify({ logger: false, trustProxy: false });
  await fastify.register(fastifyStatic, {
    root: deps.spaDir,
    prefix: "/",
    wildcard: false,
  });

  fastify.get("/healthz", async () => ({ ok: true, session: deps.store.id }));
  fastify.get("/closed", async (_req, reply) => {
    return reply.sendFile("index.html");
  });
  fastify.setNotFoundHandler(async (_req, reply) => reply.sendFile("index.html"));

  await fastify.listen({ host: "127.0.0.1", port: deps.port });
  const addr = fastify.server.address();
  const port = typeof addr === "object" && addr ? addr.port : deps.port;
  return { fastify, port };
}
```

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(mcp-server): Fastify HTTP serves SPA from 127.0.0.1 only"
```

---

## Task S.12 — WebSocket server + broadcast + Origin check

**Files:**
- Create: `packages/mcp-server/src/ws.ts`
- Create: `packages/mcp-server/tests/ws.test.ts`

- [ ] **Step 1: Test**

```ts
// packages/mcp-server/tests/ws.test.ts
import { describe, it, expect, afterEach } from "vitest";
import { WebSocket, WebSocketServer } from "ws";
import { createServer, type Server as HttpServer } from "node:http";
import { attachWebSocket } from "../src/ws.js";
import { SessionStore } from "../src/session-store.js";
import { EventEnvelopeSchema } from "@interactive-learning/protocol";

async function listen(): Promise<{ http: HttpServer; port: number }> {
  const http = createServer();
  await new Promise<void>((r) => http.listen(0, "127.0.0.1", r));
  const port = (http.address() as { port: number }).port;
  return { http, port };
}

describe("WebSocket", () => {
  let cleanup: Array<() => Promise<void>> = [];
  afterEach(async () => {
    for (const c of cleanup) await c();
    cleanup = [];
  });

  it("rejects connections from non-local origins", async () => {
    const { http, port } = await listen();
    const store = new SessionStore();
    attachWebSocket(http, store, { allowedOrigins: [`http://127.0.0.1:${port}`] });
    cleanup.push(async () => http.close());
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { Origin: "http://evil.com" } });
    await new Promise((r) => ws.on("close", r));
    expect(ws.readyState).toBe(WebSocket.CLOSED);
  });

  it("broadcasts recorded events to connected clients", async () => {
    const { http, port } = await listen();
    const store = new SessionStore();
    attachWebSocket(http, store, { allowedOrigins: [`http://127.0.0.1:${port}`] });
    cleanup.push(async () => http.close());
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { Origin: `http://127.0.0.1:${port}` } });
    await new Promise((r) => ws.on("open", r));
    const msgP = new Promise<string>((r) => ws.on("message", (d) => r(d.toString())));
    store.recordEvent({ slot_id: "s1", slot_version: 1, type: "quiz.x", payload: {} });
    const msg = JSON.parse(await msgP);
    expect(msg.kind).toBe("event");
    expect(() => EventEnvelopeSchema.parse(msg.event)).not.toThrow();
  });

  it("forwards inbound client events into SessionStore", async () => {
    const { http, port } = await listen();
    const store = new SessionStore();
    attachWebSocket(http, store, { allowedOrigins: [`http://127.0.0.1:${port}`] });
    cleanup.push(async () => http.close());
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { Origin: `http://127.0.0.1:${port}` } });
    await new Promise((r) => ws.on("open", r));
    const before = store.currentCursor();
    ws.send(JSON.stringify({
      kind: "event",
      slot_id: "s1", slot_version: 1, type: "quiz.answer_submitted", payload: { question_id: "q1", value: "b" },
    }));
    await new Promise((r) => setTimeout(r, 20));
    expect(store.eventsAfter(before).some((e) => e.type === "quiz.answer_submitted")).toBe(true);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/ws.ts
import { WebSocketServer, type WebSocket } from "ws";
import type { Server as HttpServer } from "node:http";
import { EventEnvelopeSchema } from "@interactive-learning/protocol";
import type { SessionStore } from "./session-store.js";

export interface WsOptions {
  allowedOrigins: readonly string[];
}

const InboundSchema = {
  // Inlined lightweight runtime check; tighter schema lives in protocol package if we need it.
  kind: "event",
};

export function attachWebSocket(http: HttpServer, store: SessionStore, opts: WsOptions): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true, path: "/ws" });

  http.on("upgrade", (req, socket, head) => {
    if (req.url !== "/ws") return;
    const origin = req.headers.origin ?? "";
    if (!opts.allowedOrigins.includes(origin)) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  wss.on("connection", (ws: WebSocket) => {
    store.browserConnected = true;

    const unsub = store.onEvent((ev) => {
      ws.send(JSON.stringify({ kind: "event", event: ev }));
    });

    ws.on("message", (raw) => {
      try {
        const parsed = JSON.parse(raw.toString()) as { kind: string } & Record<string, unknown>;
        if (parsed.kind !== InboundSchema.kind) return;
        store.recordEvent({
          slot_id: String(parsed.slot_id),
          slot_version: Number(parsed.slot_version),
          type: String(parsed.type),
          payload: parsed.payload,
        });
      } catch {
        // ignore malformed frames
      }
    });

    ws.on("close", () => {
      store.browserConnected = false;
      unsub();
    });
  });

  return wss;
}
```

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(mcp-server): WebSocket with Origin check + bidirectional event bridge"
```

---

## Task S.13 — Port allocator

**Files:**
- Create: `packages/mcp-server/src/port.ts`
- Create: `packages/mcp-server/tests/port.test.ts`

Strategy: try fixed fallback `7654` → on EADDRINUSE, random in `[49152, 65535]` up to 5 retries → else throw.

- [ ] **Step 1: Test**

```ts
// packages/mcp-server/tests/port.test.ts
import { describe, it, expect } from "vitest";
import { allocatePort, FALLBACK_PORT } from "../src/port.js";
import { createServer } from "node:http";

describe("allocatePort", () => {
  it("returns fallback port when free", async () => {
    const port = await allocatePort();
    expect(typeof port).toBe("number");
    expect(port).toBeGreaterThanOrEqual(1024);
  });

  it("falls back to random when fallback is taken", async () => {
    const hog = createServer();
    await new Promise<void>((r) => hog.listen(FALLBACK_PORT, "127.0.0.1", r));
    try {
      const port = await allocatePort();
      expect(port).not.toBe(FALLBACK_PORT);
      expect(port).toBeGreaterThanOrEqual(49152);
      expect(port).toBeLessThanOrEqual(65535);
    } finally {
      hog.close();
    }
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/port.ts
import { createServer } from "node:http";

export const FALLBACK_PORT = 7654;
export const RANDOM_MIN = 49152;
export const RANDOM_MAX = 65535;
export const MAX_RETRIES = 5;

export async function allocatePort(): Promise<number> {
  if (await isFree(FALLBACK_PORT)) return FALLBACK_PORT;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const p = Math.floor(Math.random() * (RANDOM_MAX - RANDOM_MIN + 1)) + RANDOM_MIN;
    if (await isFree(p)) return p;
  }
  throw new Error("PORT_EXHAUSTED: no free port after retries");
}

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = createServer();
    s.once("error", () => resolve(false));
    s.listen(port, "127.0.0.1", () => s.close(() => resolve(true)));
  });
}
```

- [ ] **Step 3: Add lockfile (required per FR-PROC-02 / RPD §4.2)**

Write `~/interactive-learning/ports.lock` with `{ pid, port, session_id, started_at }` on bind; unlink on graceful shutdown and on `SIGINT`/`SIGTERM`. Use `proper-lockfile` for cross-platform atomicity (falls back to `fs.writeFile` with `wx` flag). On allocator start, read existing lockfile(s): if the recorded `pid` is no longer alive, treat the lock as stale and remove it.

Add test `packages/mcp-server/tests/port-lockfile.test.ts` covering:
- lockfile created on bind, removed on shutdown
- stale lockfile (pid gone) is cleared and port can be reused
- two concurrent instances do not both claim the same port

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(mcp-server): port allocator with fallback + random range"
```

---

## Task S.14 — Lazy bring-up + auto `open` browser

The HTTP+WS servers only start when the **first** UI tool is called. Wrap `buildServer` in a lifecycle owner.

**Files:**
- Create: `packages/mcp-server/src/lifecycle.ts`
- Create: `packages/mcp-server/tests/lifecycle.test.ts`

- [ ] **Step 1: Test**

```ts
// packages/mcp-server/tests/lifecycle.test.ts
import { describe, it, expect, vi } from "vitest";
import { Lifecycle } from "../src/lifecycle.js";

describe("Lifecycle", () => {
  it("does not start HTTP until ensureHttp() is called", async () => {
    const openMock = vi.fn();
    const lc = new Lifecycle({ spaDir: "/tmp", open: openMock });
    expect(lc.httpStarted).toBe(false);
    // we don't actually start a socket here; we stub the starter
  });

  it("calls open() exactly once per session", async () => {
    const openMock = vi.fn();
    const lc = new Lifecycle({ spaDir: "/tmp", open: openMock, startHttp: async () => ({ port: 7654, close: async () => {} }) });
    await lc.ensureHttp();
    await lc.ensureHttp();
    expect(openMock).toHaveBeenCalledTimes(1);
    expect(openMock).toHaveBeenCalledWith("http://127.0.0.1:7654/");
    await lc.shutdown();
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/lifecycle.ts
import open from "open";
import type { FastifyInstance } from "fastify";
import { buildHttpServer } from "./http.js";
import { attachWebSocket } from "./ws.js";
import { allocatePort } from "./port.js";
import type { SessionStore } from "./session-store.js";
import type { CatalogRegistry } from "./catalog.js";

export interface LifecycleDeps {
  spaDir: string;
  store?: SessionStore;
  catalog?: CatalogRegistry;
  open?: (url: string) => Promise<unknown>;
  startHttp?: (port: number) => Promise<{ port: number; close: () => Promise<void> }>;
}

export class Lifecycle {
  httpStarted = false;
  private port?: number;
  private closers: Array<() => Promise<void>> = [];
  private readonly opener: (url: string) => Promise<unknown>;
  private readonly customStart?: LifecycleDeps["startHttp"];

  constructor(private readonly deps: LifecycleDeps) {
    this.opener = deps.open ?? ((url) => open(url));
    this.customStart = deps.startHttp;
  }

  async ensureHttp(): Promise<number> {
    if (this.httpStarted && this.port != null) return this.port;
    const port = await allocatePort();
    if (this.customStart) {
      const handle = await this.customStart(port);
      this.port = handle.port;
      this.closers.push(handle.close);
    } else {
      if (!this.deps.store || !this.deps.catalog) throw new Error("store+catalog required");
      const { fastify, port: bound } = await buildHttpServer({
        store: this.deps.store,
        catalog: this.deps.catalog,
        spaDir: this.deps.spaDir,
        port,
      });
      attachWebSocket(fastify.server, this.deps.store, {
        allowedOrigins: [`http://127.0.0.1:${bound}`],
      });
      this.port = bound;
      this.closers.push(async () => { await fastify.close(); });
    }
    this.httpStarted = true;
    await this.opener(`http://127.0.0.1:${this.port}/`);
    return this.port;
  }

  async shutdown(): Promise<void> {
    for (const c of this.closers.reverse()) await c();
    this.closers = [];
    this.httpStarted = false;
  }
}
```

- [ ] **Step 3: Wire into tools**

In `server.ts`, every `CallToolRequestSchema` handler calls `await lifecycle.ensureHttp()` before invoking the handler (or equivalently, wrap each handler). Keep the call idempotent.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(mcp-server): lazy HTTP/WS bring-up and single-shot open"
```

---

## Task S.15 — Idle timeout + graceful shutdown

**Files:**
- Modify: `packages/mcp-server/src/lifecycle.ts`
- Create: `packages/mcp-server/tests/idle-timeout.test.ts`

- [ ] **Step 1: Test (with fake timers)**

```ts
// packages/mcp-server/tests/idle-timeout.test.ts
import { describe, it, expect, vi } from "vitest";
import { IdleWatchdog } from "../src/lifecycle.js";
import { SessionStore } from "../src/session-store.js";

describe("IdleWatchdog", () => {
  it("emits warn at 25 min, terminates at 30 min", async () => {
    vi.useFakeTimers();
    const store = new SessionStore();
    const onWarn = vi.fn();
    const onTerminate = vi.fn();
    const w = new IdleWatchdog(store, { warnMs: 25 * 60_000, terminateMs: 30 * 60_000, onWarn, onTerminate });
    w.start();
    vi.advanceTimersByTime(25 * 60_000 + 1);
    expect(onWarn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5 * 60_000);
    expect(onTerminate).toHaveBeenCalledTimes(1);
    w.stop();
    vi.useRealTimers();
  });

  it("resets on tool call activity", async () => {
    vi.useFakeTimers();
    const store = new SessionStore();
    const onTerminate = vi.fn();
    const w = new IdleWatchdog(store, { warnMs: 25, terminateMs: 30, onWarn: () => {}, onTerminate });
    w.start();
    vi.advanceTimersByTime(20);
    store.lastAgentToolCall = Date.now();
    w.ping();
    vi.advanceTimersByTime(20);
    expect(onTerminate).not.toHaveBeenCalled();
    w.stop();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Implement `IdleWatchdog` and export from `lifecycle.ts`**

```ts
// inside packages/mcp-server/src/lifecycle.ts
export interface IdleWatchdogOptions {
  warnMs: number;
  terminateMs: number;
  onWarn: () => void;
  onTerminate: () => void;
}

export class IdleWatchdog {
  private warnTimer?: NodeJS.Timeout;
  private termTimer?: NodeJS.Timeout;
  constructor(private readonly store: { lastAgentToolCall: number }, private readonly opts: IdleWatchdogOptions) {}
  start(): void { this.ping(); }
  ping(): void {
    if (this.warnTimer) clearTimeout(this.warnTimer);
    if (this.termTimer) clearTimeout(this.termTimer);
    this.warnTimer = setTimeout(this.opts.onWarn, this.opts.warnMs);
    this.termTimer = setTimeout(this.opts.onTerminate, this.opts.terminateMs);
  }
  stop(): void {
    if (this.warnTimer) clearTimeout(this.warnTimer);
    if (this.termTimer) clearTimeout(this.termTimer);
  }
}
```

- [ ] **Step 3: Wire stdio-disconnect → process exit**

At the entry point (Task S.18), listen on `StdioServerTransport` `onclose` and call `lifecycle.shutdown()` then `process.exit(0)`.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(mcp-server): idle watchdog (25m warn, 30m terminate) with reset"
```

---

## Task S.16 — Structured JSON-RPC errors + Zod issue mapper

Replace the stub error from S.4 with a real one that surfaces Zod issue paths.

**Files:**
- Modify: `packages/mcp-server/src/errors.ts`
- Create: `packages/mcp-server/tests/errors.test.ts`

- [ ] **Step 1: Test**

```ts
// packages/mcp-server/tests/errors.test.ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { toJsonRpcError } from "../src/errors.js";

describe("toJsonRpcError", () => {
  it("maps ZodError to MCP InvalidParams with path + expected + received", () => {
    const schema = z.object({ kind: z.enum(["a", "b"]) });
    try { schema.parse({ kind: "c" }); } catch (e) {
      const err = toJsonRpcError(e, { component: "Quiz" });
      expect(err.code).toBe(-32602);
      expect(err.data.component).toBe("Quiz");
      expect(err.data.issues[0].path).toEqual(["kind"]);
      expect(err.data.issues[0].expected).toMatch(/a|b/);
    }
  });

  it("preserves domain codes like UNKNOWN_COMPONENT", () => {
    const domain = new Error("UNKNOWN_COMPONENT: Quiz") as Error & { code?: string };
    domain.code = "UNKNOWN_COMPONENT";
    const err = toJsonRpcError(domain);
    expect(err.code).toBe(-32602);
    expect(err.data.reason).toBe("UNKNOWN_COMPONENT");
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/errors.ts
import { ZodError } from "zod";

export interface JsonRpcError extends Error {
  code: number;
  data: Record<string, unknown>;
}

export function toJsonRpcError(cause: unknown, extra: Record<string, unknown> = {}): JsonRpcError {
  if (cause instanceof ZodError) {
    const issues = cause.issues.map((i) => ({
      path: i.path,
      expected: "expected" in i ? String((i as { expected?: unknown }).expected ?? "") : i.code,
      received: "received" in i ? (i as { received?: unknown }).received : undefined,
      message: i.message,
    }));
    const err = new Error("Validation failed") as JsonRpcError;
    err.code = -32602;
    err.data = { issues, ...extra };
    return err;
  }
  if (cause instanceof Error) {
    const err = cause as JsonRpcError;
    err.code = -32602;
    const domainCode = (cause as { code?: unknown }).code;
    err.data = { reason: typeof domainCode === "string" ? domainCode : cause.name, message: cause.message, ...extra };
    return err;
  }
  const err = new Error(String(cause)) as JsonRpcError;
  err.code = -32603;
  err.data = { reason: "INTERNAL", ...extra };
  return err;
}
```

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(mcp-server): structured JSON-RPC errors with Zod issue mapping"
```

---

## Task S.17 — pino logging (stderr) + DEBUG env

**Files:**
- Create: `packages/mcp-server/src/log.ts`
- Create: `packages/mcp-server/tests/log.test.ts`

- [ ] **Step 1: Test**

```ts
// packages/mcp-server/tests/log.test.ts
import { describe, it, expect } from "vitest";
import { createLogger } from "../src/log.js";

describe("logger", () => {
  it("writes to stderr stream (not stdout)", () => {
    const log = createLogger({ level: "info" });
    expect(log.level).toBe("info");
  });

  it("respects DEBUG=interactive-learning:* to raise level", () => {
    const log = createLogger({ level: "info", debugEnv: "interactive-learning:*" });
    expect(log.level).toBe("debug");
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/log.ts
import pino, { type Logger } from "pino";

export function createLogger(opts: { level?: string; debugEnv?: string } = {}): Logger {
  const debugEnv = opts.debugEnv ?? process.env.DEBUG ?? "";
  const level = /interactive-learning(:\*|$)/.test(debugEnv) ? "debug" : (opts.level ?? "info");
  return pino({ level, base: { pkg: "interactive-learning" } }, pino.destination(2 /* stderr */));
}
```

- [ ] **Step 3: Inject into handlers**

Pass `log` through `buildServer(opts)` and every tool handler. Log tool call + result; include `session_id`.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(mcp-server): pino logger on stderr with DEBUG env"
```

---

## Task S.18 — `bin/interactive-learning-mcp` entry + `npx` support

**Files:**
- Create: `packages/mcp-server/bin/server.js` (shebang, imports from `dist`)
- Modify: `packages/mcp-server/src/index.ts`
- Create: `packages/mcp-server/src/main.ts`

- [ ] **Step 1: Main**

Write `packages/mcp-server/src/main.ts`:
```ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildServer } from "./server.js";
import { Lifecycle, IdleWatchdog } from "./lifecycle.js";
import { createLogger } from "./log.js";
import { registerDefaultCatalog } from "./catalog-bindings.js"; // added at integration (see S.19 + UI build)

export async function main(): Promise<void> {
  const log = createLogger();
  const { server, store, catalog } = buildServer();
  registerDefaultCatalog(catalog);

  const here = path.dirname(fileURLToPath(import.meta.url));
  const spaDir = path.resolve(here, "..", "spa");
  const lifecycle = new Lifecycle({ spaDir, store, catalog });

  const watchdog = new IdleWatchdog(store, {
    warnMs: 25 * 60_000,
    terminateMs: 30 * 60_000,
    onWarn: () => log.warn("session idle 25m"),
    onTerminate: () => { log.info("idle shutdown"); void shutdown(0); },
  });
  watchdog.start();

  async function shutdown(code: number) {
    try { await lifecycle.shutdown(); } catch {}
    watchdog.stop();
    process.exit(code);
  }

  const transport = new StdioServerTransport();
  transport.onclose = () => void shutdown(0);
  await server.connect(transport);
  log.info({ session_id: store.id }, "MCP server started");
}
```

Write `packages/mcp-server/bin/server.js`:
```js
#!/usr/bin/env node
import("../dist/main.js").then((m) => m.main()).catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: `catalog-bindings.ts` — import schemas from protocol**

Both UI components and the server import the same Zod schemas directly from `@interactive-learning/protocol` (see F.2 Step 9). No UI↔server cross-dependency, no React in the server bundle.

Write `packages/mcp-server/src/catalog-bindings.ts`:

```ts
import type { CatalogRegistry } from "./catalog.js";
import {
  MarkdownPropsSchema, MarkdownEventSchemas,
  QuizPropsSchema, QuizEventSchemas,
  FlashCardPropsSchema, FlashCardEventSchemas,
  StepByStepPropsSchema, StepByStepEventSchemas,
  DiagramPropsSchema, DiagramEventSchemas,
  HintPropsSchema, HintEventSchemas,
} from "@interactive-learning/protocol";

export function registerDefaultCatalog(reg: CatalogRegistry): void {
  reg.register({ type: "Markdown",   props: MarkdownPropsSchema,   events: MarkdownEventSchemas   });
  reg.register({ type: "Quiz",       props: QuizPropsSchema,       events: QuizEventSchemas       });
  reg.register({ type: "FlashCard",  props: FlashCardPropsSchema,  events: FlashCardEventSchemas  });
  reg.register({ type: "StepByStep", props: StepByStepPropsSchema, events: StepByStepEventSchemas });
  reg.register({ type: "Diagram",    props: DiagramPropsSchema,    events: DiagramEventSchemas    });
  reg.register({ type: "Hint",       props: HintPropsSchema,       events: HintEventSchemas       });
}
```

`@interactive-learning/protocol` is already a dependency of `packages/mcp-server` (from S.1). No new workspace link.

- [ ] **Step 3: Smoke test**

```bash
pnpm --filter @interactive-learning/mcp-server build
chmod +x packages/mcp-server/bin/server.js
node packages/mcp-server/bin/server.js < /dev/null &
sleep 1 && kill %1
```

Expected: starts and shuts down cleanly (no open port because no tool call was made).

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(mcp-server): bin entry + main wiring + shutdown plumbing"
```

---

## Task S.19 — Course pack loader (server-side file read)

Exposes a read-only helper used by the `/start_lesson` flow documentation and, optionally, a `load_lesson` future tool (not in v0.1 — agent reads files directly).

**Files:**
- Create: `packages/mcp-server/src/course-pack.ts`
- Create: `packages/mcp-server/tests/course-pack.test.ts`

- [ ] **Step 1: Test**

```ts
// packages/mcp-server/tests/course-pack.test.ts
import { describe, it, expect } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { readLessonMeta, ensureSafeAssetPath } from "../src/course-pack.js";

describe("course pack loader", () => {
  it("reads and validates meta.ts via dynamic import", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(path.join(tmp, "meta.mjs"), `
      export default {
        id: "x", title: "X", summary: "s",
        objectives: ["a"], est_minutes: 5,
      };`);
    const meta = await readLessonMeta(tmp, "meta.mjs");
    expect(meta.id).toBe("x");
  });

  it("rejects asset paths outside lesson dir (no ..)", () => {
    expect(() => ensureSafeAssetPath("/home/u/courses/py", "../../etc/passwd")).toThrow();
    expect(() => ensureSafeAssetPath("/home/u/courses/py", "assets/ok.png")).not.toThrow();
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/mcp-server/src/course-pack.ts
import path from "node:path";
import { pathToFileURL } from "node:url";
import { LessonMetaSchema, type LessonMeta } from "@interactive-learning/protocol";

export async function readLessonMeta(lessonDir: string, file = "meta.mjs"): Promise<LessonMeta> {
  const abs = path.resolve(lessonDir, file);
  const mod = await import(pathToFileURL(abs).href);
  return LessonMetaSchema.parse(mod.default ?? mod);
}

export function ensureSafeAssetPath(lessonDir: string, asset: string): string {
  const resolved = path.resolve(lessonDir, asset);
  const base = path.resolve(lessonDir) + path.sep;
  if (!resolved.startsWith(base)) throw new Error("PATH_TRAVERSAL: asset escapes lesson dir");
  return resolved;
}
```

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(mcp-server): safe course-pack meta loader + asset-path guard"
```

---

## Task S.20 — `@interactive-learning/cli validate`

The `validate` command: given a lesson dir, check `meta.ts`, any side-car YAML against Zod, and smoke-parse `index.mdx` for unknown component tags.

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/bin/validate.js`
- Create: `packages/cli/src/validate.ts`
- Create: `packages/cli/tests/validate.test.ts`

- [ ] **Step 1: Manifest**

```json
{
  "name": "@interactive-learning/cli",
  "version": "0.0.0",
  "type": "module",
  "bin": { "interactive-learning-validate": "./bin/validate.js" },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@interactive-learning/protocol": "workspace:*",
    "yaml": "^2.5.0",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Tests**

```ts
// packages/cli/tests/validate.test.ts
import { describe, it, expect } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { validateLesson } from "../src/validate.js";

describe("validateLesson", () => {
  it("passes a minimal well-formed pack", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(path.join(dir, "meta.mjs"), `export default {
      id: "x", title: "X", summary: "s", objectives: ["a"], est_minutes: 5,
    };`);
    await fs.writeFile(path.join(dir, "index.mdx"), "# Hello");
    const result = await validateLesson(dir);
    expect(result.ok).toBe(true);
  });

  it("reports meta validation errors with path", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "il-"));
    await fs.writeFile(path.join(dir, "meta.mjs"), `export default { id: "x" };`);
    await fs.writeFile(path.join(dir, "index.mdx"), "# Hi");
    const result = await validateLesson(dir);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path.join(".").includes("objectives"))).toBe(true);
  });
});
```

- [ ] **Step 3: Implement**

```ts
// packages/cli/src/validate.ts
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import YAML from "yaml";
import { LessonMetaSchema } from "@interactive-learning/protocol";

export interface ValidationError { path: (string | number)[]; message: string; source: string }
export interface ValidationResult { ok: boolean; errors: ValidationError[]; warnings: ValidationError[] }

export async function validateLesson(lessonDir: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const mjs = path.join(lessonDir, "meta.mjs");
  const ts = path.join(lessonDir, "meta.ts");
  const metaFile = (await exists(mjs)) ? mjs : (await exists(ts)) ? ts : "";
  if (!metaFile) errors.push({ path: [], message: "meta.ts/meta.mjs missing", source: "meta" });
  else {
    try {
      const mod = await import(pathToFileURL(metaFile).href);
      LessonMetaSchema.parse(mod.default ?? mod);
    } catch (e) {
      if (e && typeof e === "object" && "issues" in e) {
        for (const iss of (e as { issues: Array<{ path: (string|number)[]; message: string }> }).issues) {
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
    try { YAML.parse(await fs.readFile(abs, "utf8")); }
    catch (e) { errors.push({ path: [file], message: String(e), source: "yaml" }); }
  }

  return { ok: errors.length === 0, errors, warnings };
}

async function exists(p: string): Promise<boolean> {
  return fs.stat(p).then(() => true).catch(() => false);
}
```

- [ ] **Step 4: `bin/validate.js`**

```js
#!/usr/bin/env node
import { validateLesson } from "../dist/validate.js";

const dir = process.argv[2];
if (!dir) { console.error("usage: interactive-learning-validate <path>"); process.exit(2); }

const result = await validateLesson(dir);
if (!result.ok) {
  for (const e of result.errors) console.error(`✗ [${e.source}] ${e.path.join(".") || "(root)"}: ${e.message}`);
  process.exit(1);
}
console.log("✓ valid");
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(cli): validate command for course packs"
```

---

# UI-related tasks

## Task U.1 — Vite + React 19 scaffold

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/vite.config.ts`
- Create: `packages/ui/index.html`
- Create: `packages/ui/src/main.tsx`
- Create: `packages/ui/src/App.tsx`
- Create: `packages/ui/src/types.ts` (shared UI types)
- Create: `packages/ui/tests/setup.ts`
- Create: `packages/ui/vitest.config.ts`

- [ ] **Step 1: Manifest**

```json
{
  "name": "@interactive-learning/ui",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@interactive-learning/protocol": "workspace:*",
    "@mdx-js/mdx": "^3.1.0",
    "@tanstack/react-query": "^5.59.0",
    "fast-json-patch": "^3.1.1",
    "mermaid": "^11.4.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "ts-fsrs": "^5.0.0",
    "zod": "^4.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.5.0",
    "jsdom": "^25.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Vite config**

```ts
// packages/ui/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, "../mcp-server/spa"),
    emptyOutDir: true,
  },
  server: { port: 5173, strictPort: true },
});
```

- [ ] **Step 3: `index.html` + `main.tsx` + `App.tsx`**

```html
<!-- packages/ui/index.html -->
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><title>Interactive Learning</title></head>
<body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

```tsx
// packages/ui/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);
```

```tsx
// packages/ui/src/App.tsx
export function App() {
  return <div className="p-4">Interactive Learning</div>;
}
```

- [ ] **Step 4: Vitest config with jsdom**

```ts
// packages/ui/vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
});
```

```ts
// packages/ui/tests/setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 5: Verify**

```bash
pnpm --filter @interactive-learning/ui install
pnpm --filter @interactive-learning/ui build
ls packages/mcp-server/spa/index.html
```

- [ ] **Step 6: Commit**

```bash
git add packages/ui
git commit -m "feat(ui): Vite + React 19 scaffold, builds into mcp-server/spa"
```

---

## Task U.2 — Tailwind v4 + shadcn/ui init

**Files:**
- Create: `packages/ui/src/index.css`
- Create: `packages/ui/tailwind.config.ts` (if needed for custom tokens)
- Create: `packages/ui/components.json` (shadcn config)
- Install a handful of shadcn components we'll need: `button`, `card`, `input`, `label`, `radio-group`, `progress`, `accordion`, `collapsible`, `separator`, `badge`

- [ ] **Step 1: `index.css`**

```css
/* packages/ui/src/index.css */
@import "tailwindcss";

:root {
  --radius: 0.5rem;
}

@layer base {
  body { @apply bg-background text-foreground antialiased; font-family: ui-sans-serif, system-ui, sans-serif; }
  @media (prefers-color-scheme: dark) { :root { color-scheme: dark; } }
}
```

- [ ] **Step 2: Init shadcn**

Run (once, manual):
```bash
cd packages/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label radio-group progress accordion collapsible separator badge
```

Accept defaults (New York / slate base). Output lands in `packages/ui/src/components/ui/`.

- [ ] **Step 3: Verify build still works**

```bash
pnpm --filter @interactive-learning/ui build
```

- [ ] **Step 4: Commit**

```bash
git add packages/ui
git commit -m "feat(ui): Tailwind v4 + shadcn primitives"
```

---

## Task U.3 — WS client hook + Zustand store + TanStack Query boot

**Files:**
- Create: `packages/ui/src/state/session-store.ts`
- Create: `packages/ui/src/state/use-ws.ts`
- Create: `packages/ui/src/state/query-client.ts`
- Create: `packages/ui/tests/state/session-store.test.ts`

- [ ] **Step 1: Test**

```ts
// packages/ui/tests/state/session-store.test.ts
import { describe, it, expect } from "vitest";
import { useSessionStore } from "../../src/state/session-store.js";

describe("useSessionStore (zustand)", () => {
  it("upserts slots by id, keeping max version", () => {
    const store = useSessionStore.getState();
    store.applySnapshot({
      id: "s", started_at: 0, cursor: "", browser_connected: true, last_agent_tool_call: 0,
      slots: [
        { slot_id: "a", version: 1, type: "Quiz", props: {} },
        { slot_id: "b", version: 3, type: "FlashCard", props: {} },
      ],
      recent_events: [],
    });
    expect(useSessionStore.getState().slots.length).toBe(2);
    store.onRemoteEvent({
      event_id: "1", timestamp: 1, slot_id: "a", slot_version: 1, type: "component.updated", payload: {},
    });
    expect(useSessionStore.getState().cursor).toBe("1");
  });
});
```

- [ ] **Step 2: Implement**

```ts
// packages/ui/src/state/session-store.ts
import { create } from "zustand";
import type { EventEnvelope, SessionSnapshot, SlotState } from "@interactive-learning/protocol";

interface SessionUiState {
  sessionId: string;
  cursor: string;
  slots: SlotState[];
  connected: boolean;
  applySnapshot: (snap: SessionSnapshot) => void;
  onRemoteEvent: (e: EventEnvelope) => void;
  setConnected: (v: boolean) => void;
}

export const useSessionStore = create<SessionUiState>((set, get) => ({
  sessionId: "",
  cursor: "",
  slots: [],
  connected: false,
  applySnapshot: (snap) => set({
    sessionId: snap.id,
    cursor: snap.cursor,
    slots: [...snap.slots],
    connected: snap.browser_connected,
  }),
  onRemoteEvent: (e) => {
    // For Phase 1 we only use events to bump cursor + log; UI re-renders happen when the
    // server sends a snapshot-delta (via component.rendered/updated). A simpler-but-correct
    // approach: on any component.rendered|updated, pull latest snapshot via /session/state.
    set({ cursor: e.event_id });
  },
  setConnected: (v) => set({ connected: v }),
}));
```

```ts
// packages/ui/src/state/use-ws.ts
import { useEffect } from "react";
import { useSessionStore } from "./session-store.js";

export function useSessionWebSocket(): void {
  const onRemote = useSessionStore((s) => s.onRemoteEvent);
  const setConn = useSessionStore((s) => s.setConnected);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let backoff = 500;
    let closed = false;

    function connect() {
      ws = new WebSocket(`ws://${location.host}/ws`);
      ws.onopen = () => { setConn(true); backoff = 500; };
      ws.onclose = () => {
        setConn(false);
        if (!closed) setTimeout(connect, Math.min(backoff *= 2, 10_000));
      };
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.kind === "event") onRemote(data.event);
      };
    }
    connect();

    return () => { closed = true; ws?.close(); };
  }, [onRemote, setConn]);
}

export function sendUserEvent(type: string, slot: { id: string; version: number }, payload: unknown): void {
  const ws = (window as unknown as { __il_ws?: WebSocket }).__il_ws;
  ws?.send(JSON.stringify({ kind: "event", slot_id: slot.id, slot_version: slot.version, type, payload }));
}
```

> Note: for Phase 1 simplicity we proxy WS through the same origin (`ws://${location.host}/ws`), which the HTTP server already hosts. The `__il_ws` global is set inside `useSessionWebSocket` on open.

- [ ] **Step 3: Query client boot**

```ts
// packages/ui/src/state/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1_000, retry: 1 } },
});
```

- [ ] **Step 4: Wire in `App.tsx`**

```tsx
// packages/ui/src/App.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./state/query-client.js";
import { useSessionWebSocket } from "./state/use-ws.js";
import { SessionRoot } from "./SessionRoot.js";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Root />
    </QueryClientProvider>
  );
}

function Root() {
  useSessionWebSocket();
  return <SessionRoot />;
}
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(ui): WebSocket client + Zustand session store + TanStack Query"
```

---

## Task U.4 — `<SlotRenderer>` with catalog lookup + ErrorBoundary

**Files:**
- Create: `packages/ui/src/components/SlotRenderer.tsx`
- Create: `packages/ui/src/components/ErrorBoundary.tsx`
- Create: `packages/ui/src/catalog/catalog.ts`
- Create: `packages/ui/src/SessionRoot.tsx`
- Create: `packages/ui/tests/components/SlotRenderer.test.tsx`

- [ ] **Step 1: Test**

```tsx
// packages/ui/tests/components/SlotRenderer.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SlotRenderer } from "../../src/components/SlotRenderer.js";
import { UI_CATALOG } from "../../src/catalog/catalog.js";

describe("SlotRenderer", () => {
  beforeEach(() => {
    UI_CATALOG.register({ type: "Stub", Component: () => <div>hello</div>, propsSchema: undefined });
  });

  it("renders a known component", () => {
    render(<SlotRenderer slot={{ slot_id: "a", version: 1, type: "Stub", props: {} }} />);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("shows fallback UI for unknown component and emits component.render_error", () => {
    render(<SlotRenderer slot={{ slot_id: "b", version: 1, type: "Nope", props: {} }} />);
    expect(screen.getByText(/Unknown component/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement catalog**

```tsx
// packages/ui/src/catalog/catalog.ts
import type { ComponentType } from "react";
import type { z } from "zod";

export interface UiComponentEntry<P = unknown> {
  type: string;
  Component: ComponentType<{ slotId: string; slotVersion: number; props: P }>;
  propsSchema: z.ZodType<P>;
}

class UiCatalog {
  private readonly entries = new Map<string, UiComponentEntry>();
  register(entry: UiComponentEntry) { this.entries.set(entry.type, entry); }
  get(type: string): UiComponentEntry | undefined { return this.entries.get(type); }
  list(): UiComponentEntry[] { return [...this.entries.values()]; }
}
export const UI_CATALOG = new UiCatalog();
```

- [ ] **Step 3: Implement SlotRenderer + ErrorBoundary**

```tsx
// packages/ui/src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from "react";
import { sendUserEvent } from "../state/use-ws.js";

interface Props { slotId: string; slotVersion: number; fallback: (err: Error) => ReactNode; children: ReactNode }
interface State { error: Error | null }

export class SlotErrorBoundary extends Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error) {
    sendUserEvent("component.render_error", { id: this.props.slotId, version: this.props.slotVersion }, {
      message: error.message, stack: error.stack,
    });
  }
  render() { return this.state.error ? this.props.fallback(this.state.error) : this.props.children; }
}
```

```tsx
// packages/ui/src/components/SlotRenderer.tsx
import type { SlotState } from "@interactive-learning/protocol";
import { UI_CATALOG } from "../catalog/catalog.js";
import { SlotErrorBoundary } from "./ErrorBoundary.js";

export function SlotRenderer({ slot }: { slot: SlotState }) {
  const entry = UI_CATALOG.get(slot.type);
  if (!entry) {
    return (
      <div role="alert" className="rounded border border-destructive/50 p-3 text-sm">
        Unknown component: <code>{slot.type}</code>
      </div>
    );
  }
  const C = entry.Component;
  return (
    <SlotErrorBoundary
      slotId={slot.slot_id}
      slotVersion={slot.version}
      fallback={(err) => (
        <div role="alert" className="rounded border border-destructive/50 p-3 text-sm">
          Render error in <code>{slot.type}</code>: {err.message}
        </div>
      )}
    >
      <C slotId={slot.slot_id} slotVersion={slot.version} props={slot.props} />
    </SlotErrorBoundary>
  );
}
```

- [ ] **Step 4: `SessionRoot` that iterates slots**

```tsx
// packages/ui/src/SessionRoot.tsx
import { useSessionStore } from "./state/session-store.js";
import { SlotRenderer } from "./components/SlotRenderer.js";

export function SessionRoot() {
  const slots = useSessionStore((s) => s.slots);
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      {slots.map((s) => (
        <section key={s.slot_id} data-slot-id={s.slot_id} data-slot-version={s.version}>
          <SlotRenderer slot={s} />
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(ui): SlotRenderer with catalog lookup + ErrorBoundary"
```

---

## Task U.5 — Component: `Markdown` (MDX runtime, AST-whitelisted)

**Files:**
- Create: `packages/ui/src/components/Markdown.tsx`
- Create: `packages/ui/src/mdx/compile.ts`
- Create: `packages/ui/src/mdx/remark-whitelist.ts`
- Create: `packages/ui/tests/components/Markdown.test.tsx`
- Create: `packages/ui/tests/mdx/remark-whitelist.test.ts`

> **No local schema file** — `MarkdownPropsSchema` / `MarkdownEventSchemas` are imported from `@interactive-learning/protocol` (F.2 Step 9).
>
> **No `importYaml` helper** — per RPD FR-PKG-03 (revised), the agent/CLI reads YAML and passes validated data as `<Quiz questions={...} />` props. The browser never reads local files.

- [ ] **Step 1: Remark AST whitelist plugin (NFR-SEC-03)**

This is the load-bearing security control. `@mdx-js/mdx` will happily execute arbitrary JSX expressions and imports; we strip them at the AST level before `compile`.

Write `packages/ui/src/mdx/remark-whitelist.ts`:
```ts
import type { Plugin } from "unified";
import type { Root } from "mdast";
import { visit } from "unist-util-visit";

const FORBIDDEN_HTML_TAGS = new Set(["script", "iframe", "object", "embed", "link", "meta", "style"]);

export interface WhitelistOptions {
  allowedComponents: ReadonlySet<string>;
}

export class MdxSecurityError extends Error {
  constructor(message: string, public readonly node: unknown) {
    super(message);
    this.name = "MdxSecurityError";
  }
}

export const remarkWhitelist: Plugin<[WhitelistOptions], Root> = (opts) => {
  return (tree) => {
    visit(tree, (node) => {
      // 1. Reject imports / exports (top-level ESM)
      if (node.type === "mdxjsEsm") {
        throw new MdxSecurityError("MDX ESM (import/export) is not allowed", node);
      }
      // 2. Reject arbitrary JS expressions: `{eval("…")}`, `{fetch(…)}`, etc.
      if (node.type === "mdxFlowExpression" || node.type === "mdxTextExpression") {
        throw new MdxSecurityError("MDX expressions ({…}) are not allowed", node);
      }
      // 3. Reject JSX components outside the catalog
      if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
        const n = node as { name: string | null; attributes?: unknown[] };
        if (!n.name) throw new MdxSecurityError("Fragment-like JSX not allowed", node);
        if (FORBIDDEN_HTML_TAGS.has(n.name.toLowerCase())) {
          throw new MdxSecurityError(`HTML tag <${n.name}> is not allowed`, node);
        }
        const isComponent = n.name[0] === n.name[0].toUpperCase();
        if (isComponent && !opts.allowedComponents.has(n.name)) {
          throw new MdxSecurityError(`Component <${n.name}> is not in catalog`, node);
        }
        // Reject expression attributes (`on={() => …}`, etc.)
        for (const attr of n.attributes ?? []) {
          const a = attr as { type: string; value?: { type?: string } };
          if (a.type === "mdxJsxExpressionAttribute") {
            throw new MdxSecurityError("Spread / expression attributes not allowed", attr);
          }
          if (a.value && typeof a.value === "object" && a.value.type === "mdxJsxAttributeValueExpression") {
            throw new MdxSecurityError("JSX attribute expressions not allowed", attr);
          }
        }
      }
      // 4. Reject raw HTML (fallback — could hide `<script>` via rehype-raw etc.)
      if (node.type === "html") {
        throw new MdxSecurityError("Raw HTML is not allowed", node);
      }
    });
  };
};
```

- [ ] **Step 2: Whitelist plugin tests (write BEFORE compile.ts)**

Write `packages/ui/tests/mdx/remark-whitelist.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { remarkWhitelist, MdxSecurityError } from "../../src/mdx/remark-whitelist.js";

function run(src: string, allowed: string[] = []) {
  return unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkWhitelist, { allowedComponents: new Set(allowed) })
    .runSync(unified().use(remarkParse).use(remarkMdx).parse(src));
}

describe("remarkWhitelist", () => {
  it("allows plain markdown", () => {
    expect(() => run("# Hello **world**")).not.toThrow();
  });
  it("allows whitelisted component", () => {
    expect(() => run("<Quiz questions={[]}/>", ["Quiz"])).toThrow(); // attribute expression
    expect(() => run("<Quiz/>", ["Quiz"])).not.toThrow();
  });
  it("rejects non-whitelisted component", () => {
    expect(() => run("<EvilWidget/>", ["Quiz"])).toThrow(MdxSecurityError);
  });
  it("rejects <script>", () => {
    expect(() => run("<script>alert(1)</script>", ["Quiz"])).toThrow(/script/);
  });
  it("rejects ESM import", () => {
    expect(() => run("import x from './y'\n\n# h", ["Quiz"])).toThrow(/ESM/);
  });
  it("rejects {expression}", () => {
    expect(() => run("# {eval('1')}", [])).toThrow(/expression/);
  });
  it("rejects JSX attribute expression", () => {
    expect(() => run('<Quiz onX={() => {}}/>', ["Quiz"])).toThrow(/attribute expression/);
  });
});
```

- [ ] **Step 3: Component test**

Write `packages/ui/tests/components/Markdown.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Markdown } from "../../src/components/Markdown.js";

describe("Markdown component", () => {
  it("renders plain MDX", async () => {
    render(<Markdown slotId="s" slotVersion={1} props={{ content: "# Hello **world**" }} />);
    await waitFor(() => expect(screen.getByText("world")).toBeInTheDocument());
  });
  it("shows fallback on security violation (script tag)", async () => {
    render(<Markdown slotId="s" slotVersion={1} props={{ content: "<script>alert(1)</script>" }} />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
```

- [ ] **Step 4: Implement MDX compile with whitelist**

```ts
// packages/ui/src/mdx/compile.ts
import { compile, run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { remarkWhitelist } from "./remark-whitelist.js";

export async function compileMdx(src: string, allowedComponents: ReadonlySet<string>) {
  // Whitelist plugin throws MdxSecurityError on any forbidden node — the thrown
  // error propagates to the caller and is caught by the Markdown component's
  // try/catch to render a fallback. Nothing reaches `run()` unless the AST is clean.
  const code = String(
    await compile(src, {
      outputFormat: "function-body",
      development: false,
      remarkPlugins: [[remarkWhitelist, { allowedComponents }]],
      // Defence in depth: no rehype-raw, no providerImportSource.
    }),
  );
  const { default: Component } = await run(code, { ...runtime, baseUrl: import.meta.url });
  return { Component };
}
```

- [ ] **Step 5: Implement component**

```tsx
// packages/ui/src/components/Markdown.tsx
import { useEffect, useState } from "react";
import { MarkdownPropsSchema, type MarkdownProps } from "@interactive-learning/protocol";
import { compileMdx } from "../mdx/compile.js";
import { UI_CATALOG } from "../catalog/catalog.js";

export function Markdown({ slotId, slotVersion, props }: { slotId: string; slotVersion: number; props: unknown }) {
  const parsed: MarkdownProps = MarkdownPropsSchema.parse(props);
  const [Comp, setComp] = useState<null | (() => React.ReactElement)>(null);
  const [err, setErr] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const allowed = new Set(UI_CATALOG.list().map((e) => e.type));
    const components = Object.fromEntries(UI_CATALOG.list().map((e) => [e.type, e.Component]));
    compileMdx(parsed.content, allowed)
      .then(({ Component }) => { if (!cancelled) setComp(() => () => <Component components={components}/>); })
      .catch((e) => { if (!cancelled) setErr(e as Error); });
    return () => { cancelled = true; };
  }, [parsed.content]);

  if (err) {
    return (
      <div role="alert" className="rounded border border-destructive/50 p-3 text-sm">
        MDX rejected: {err.message}
      </div>
    );
  }
  if (!Comp) return <div className="text-sm text-muted-foreground">Rendering…</div>;
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none" id={parsed.id_prefix}>
      <Comp />
    </article>
  );
}
```

- [ ] **Step 6: Register in catalog**

Add in `packages/ui/src/catalog/register.ts`:
```ts
import { MarkdownPropsSchema } from "@interactive-learning/protocol";
import { UI_CATALOG } from "./catalog.js";
import { Markdown } from "../components/Markdown.js";

UI_CATALOG.register({ type: "Markdown", Component: Markdown, propsSchema: MarkdownPropsSchema });
```

Import `register.ts` once in `main.tsx`.

- [ ] **Step 7: Commit**

```bash
git commit -am "feat(ui): Markdown component with MDX runtime + nested catalog components"
```

---

## Task U.6 — Component: `Quiz`

**Files:**
- Create: `packages/ui/src/components/Quiz.tsx`
- Create: `packages/ui/tests/components/Quiz.test.tsx`

> Schema lives in `@interactive-learning/protocol` (F.2 Step 9). If Phase 1 needs a `.min(1)` on questions stricter than the protocol default, tighten it in the protocol package, not here — the server's catalog validator must see the same rule.

- [ ] **Step 1: Test**

```tsx
// packages/ui/tests/components/Quiz.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Quiz } from "../../src/components/Quiz.js";

vi.mock("../../src/state/use-ws.js", () => ({
  sendUserEvent: vi.fn(),
}));
const { sendUserEvent } = await import("../../src/state/use-ws.js");

describe("Quiz", () => {
  it("submits answer_submitted + all_submitted with correct payloads", async () => {
    render(<Quiz slotId="s1" slotVersion={1} props={{
      questions: [
        { id: "q1", kind: "single_choice", prompt: "Pick b", options: [
          { id: "a", label: "A", is_correct: false }, { id: "b", label: "B", is_correct: true },
        ]},
      ],
      reveal_mode: "on_submit", allow_retry: true,
    }}/>);
    await userEvent.click(screen.getByLabelText("B"));
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(sendUserEvent).toHaveBeenCalledWith("quiz.answer_submitted", expect.anything(), { question_id: "q1", value: "b" });
    expect(sendUserEvent).toHaveBeenCalledWith("quiz.all_submitted", expect.anything(), { answers: { q1: "b" } });
  });
});
```

- [ ] **Step 2: Implement Quiz using shadcn primitives**

```tsx
// packages/ui/src/components/Quiz.tsx
import { useState } from "react";
import { QuizPropsSchema, type QuizProps } from "@interactive-learning/protocol";
import { sendUserEvent } from "../state/use-ws.js";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group.js";
import { Label } from "./ui/label.js";
import { Button } from "./ui/button.js";
import { Input } from "./ui/input.js";
import { Card } from "./ui/card.js";

export function Quiz({ slotId, slotVersion, props }: { slotId: string; slotVersion: number; props: QuizProps }) {
  const parsed = QuizPropsSchema.parse(props);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const slot = { id: slotId, version: slotVersion };

  const setAnswer = (qid: string, value: unknown) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    sendUserEvent("quiz.answer_submitted", slot, { question_id: qid, value });
  };

  const onSubmit = () => {
    setSubmitted(true);
    sendUserEvent("quiz.all_submitted", slot, { answers });
  };

  return (
    <Card className="p-4 space-y-4">
      {parsed.title && <h2 className="text-lg font-semibold">{parsed.title}</h2>}
      {parsed.questions.map((q) => (
        <div key={q.id} className="space-y-2">
          <p className="font-medium">{q.prompt}</p>
          {q.kind === "single_choice" && (
            <RadioGroup onValueChange={(v) => setAnswer(q.id, v)}>
              {q.options?.map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <RadioGroupItem value={o.id} id={`${slotId}-${q.id}-${o.id}`} />
                  <Label htmlFor={`${slotId}-${q.id}-${o.id}`}>{o.label}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {q.kind === "short_answer" && (
            <Input onChange={(e) => setAnswer(q.id, e.target.value)} />
          )}
          {submitted && parsed.reveal_mode !== "never" && q.explanation && (
            <p className="text-sm text-muted-foreground">{q.explanation}</p>
          )}
        </div>
      ))}
      <Button onClick={onSubmit} disabled={submitted && !parsed.allow_retry}>Submit</Button>
    </Card>
  );
}
```

> Multi-choice rendering follows the same pattern with `Checkbox`; skipping verbatim code to keep the plan compact.

- [ ] **Step 3: Register + commit**

Add to `register.ts` (importing `QuizPropsSchema` from `@interactive-learning/protocol`) and commit:
```bash
git commit -am "feat(ui): Quiz component with shadcn RadioGroup and event emit"
```

---

## Task U.7 — Component: `FlashCard`

**Files:**
- Create: `packages/ui/src/components/FlashCard.tsx`
- Create: `packages/ui/tests/components/FlashCard.test.tsx`

> Schema lives in `@interactive-learning/protocol` (F.2 Step 9).

- [ ] **Step 1: Test — flip + rate + deck_completed**

```tsx
// packages/ui/tests/components/FlashCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlashCard } from "../../src/components/FlashCard.js";

vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));
const { sendUserEvent } = await import("../../src/state/use-ws.js");

describe("FlashCard", () => {
  it("emits flashcard.flipped → flashcard.rated → deck_completed", async () => {
    render(<FlashCard slotId="s1" slotVersion={1} props={{
      deck_id: "d1",
      cards: [{ id: "c1", front: "Q?", back: "A!" }],
      mode: "study", show_progress: true,
    }}/>);
    await userEvent.click(screen.getByRole("button", { name: /flip/i }));
    await userEvent.click(screen.getByRole("button", { name: /good/i }));
    expect(sendUserEvent).toHaveBeenCalledWith("flashcard.flipped", expect.anything(), { card_id: "c1" });
    expect(sendUserEvent).toHaveBeenCalledWith("flashcard.rated", expect.anything(), { card_id: "c1", rating: "good" });
    expect(sendUserEvent).toHaveBeenCalledWith("flashcard.deck_completed", expect.anything(), { card_ids_seen: ["c1"] });
  });
});
```

- [ ] **Step 2: Implement**

```tsx
// packages/ui/src/components/FlashCard.tsx
import { useState } from "react";
import { FlashCardPropsSchema, type FlashCardProps } from "@interactive-learning/protocol";
import { sendUserEvent } from "../state/use-ws.js";
import { Card } from "./ui/card.js";
import { Button } from "./ui/button.js";
import { Progress } from "./ui/progress.js";

type Rating = "again" | "hard" | "good" | "easy";

export function FlashCard({ slotId, slotVersion, props }: { slotId: string; slotVersion: number; props: FlashCardProps }) {
  const parsed = FlashCardPropsSchema.parse(props);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const slot = { id: slotId, version: slotVersion };
  const card = parsed.cards[index];
  if (!card) return null;

  const flip = () => {
    if (!flipped) sendUserEvent("flashcard.flipped", slot, { card_id: card.id });
    setFlipped(true);
  };

  const rate = (rating: Rating) => {
    sendUserEvent("flashcard.rated", slot, { card_id: card.id, rating });
    const nextSeen = [...seen, card.id];
    setSeen(nextSeen);
    if (index + 1 >= parsed.cards.length) {
      sendUserEvent("flashcard.deck_completed", slot, { card_ids_seen: nextSeen });
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <p className="text-sm">{flipped ? card.back : card.front}</p>
      {!flipped ? (
        <Button onClick={flip}>Flip</Button>
      ) : (
        <div className="flex gap-2">
          {(["again", "hard", "good", "easy"] as Rating[]).map((r) => (
            <Button key={r} variant="outline" onClick={() => rate(r)}>{r}</Button>
          ))}
        </div>
      )}
      {parsed.show_progress && (
        <Progress value={((index + (flipped ? 0.5 : 0)) / parsed.cards.length) * 100} />
      )}
    </Card>
  );
}
```

- [ ] **Step 3: Register + commit**

Add to `register.ts` importing `FlashCardPropsSchema` from `@interactive-learning/protocol`.

```bash
git commit -am "feat(ui): FlashCard component (flip, 4-level rating, deck-complete)"
```

---

## Task U.8 — Component: `StepByStep`

**Files:**
- Create: `packages/ui/src/components/StepByStep.tsx`
- Create: `packages/ui/tests/components/StepByStep.test.tsx`

> Schema lives in `@interactive-learning/protocol` (F.2 Step 9).

- [ ] **Step 1: Test**

```tsx
// packages/ui/tests/components/StepByStep.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepByStep } from "../../src/components/StepByStep.js";

vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));
const { sendUserEvent } = await import("../../src/state/use-ws.js");

describe("StepByStep", () => {
  it("emits step.expanded on open and step.marked_done on button click", async () => {
    render(<StepByStep slotId="s1" slotVersion={1} props={{
      steps: [
        { id: "a", heading: "A", content: "aa", initially_open: false, required: false },
      ],
      navigation: "free",
    }}/>);
    await userEvent.click(screen.getByRole("button", { name: /A/ }));
    expect(sendUserEvent).toHaveBeenCalledWith("step.expanded", expect.anything(), { step_id: "a" });
    await userEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(sendUserEvent).toHaveBeenCalledWith("step.marked_done", expect.anything(), { step_id: "a" });
  });
});
```

- [ ] **Step 2: Implement using Radix Accordion**

```tsx
// packages/ui/src/components/StepByStep.tsx
import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion.js";
import { Button } from "./ui/button.js";
import { StepByStepPropsSchema, type StepByStepProps } from "@interactive-learning/protocol";
import { sendUserEvent } from "../state/use-ws.js";
import { Markdown } from "./Markdown.js";

export function StepByStep({ slotId, slotVersion, props }: { slotId: string; slotVersion: number; props: StepByStepProps }) {
  const parsed = StepByStepPropsSchema.parse(props);
  const slot = { id: slotId, version: slotVersion };
  const [openSet, setOpenSet] = useState<string[]>(parsed.steps.filter((s) => s.initially_open).map((s) => s.id));
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set());

  const onValueChange = (values: string[]) => {
    const prev = new Set(openSet);
    const next = new Set(values);
    for (const id of next) if (!prev.has(id)) sendUserEvent("step.expanded", slot, { step_id: id });
    for (const id of prev) if (!next.has(id)) sendUserEvent("step.collapsed", slot, { step_id: id });
    setOpenSet(values);
  };

  const markDone = (id: string) => {
    setDoneSet(new Set(doneSet).add(id));
    sendUserEvent("step.marked_done", slot, { step_id: id });
  };

  const disabled = (index: number) =>
    parsed.navigation === "sequential" &&
    index > 0 &&
    !doneSet.has(parsed.steps[index - 1]!.id);

  return (
    <section className="space-y-2">
      {parsed.title && <h3 className="text-lg font-semibold">{parsed.title}</h3>}
      <Accordion type="multiple" value={openSet} onValueChange={onValueChange}>
        {parsed.steps.map((s, i) => (
          <AccordionItem key={s.id} value={s.id} disabled={disabled(i)}>
            <AccordionTrigger>{s.heading}</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <Markdown slotId={`${slotId}:${s.id}`} slotVersion={slotVersion} props={{ content: s.content }} />
              {!doneSet.has(s.id) && (
                <Button size="sm" variant="secondary" onClick={() => markDone(s.id)}>Mark done</Button>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
```

- [ ] **Step 3: Register + commit**

Add to `register.ts` importing `StepByStepPropsSchema` from `@interactive-learning/protocol`.

```bash
git commit -am "feat(ui): StepByStep with Radix Accordion + sequential navigation"
```

---

## Task U.9 — Component: `Diagram` (Mermaid v11)

**Files:**
- Create: `packages/ui/src/components/Diagram.tsx`
- Create: `packages/ui/tests/components/Diagram.test.tsx`

> Schema lives in `@interactive-learning/protocol` (F.2 Step 9).

- [ ] **Step 1: Test (render smoke only; full Mermaid relies on DOM)**

```tsx
// packages/ui/tests/components/Diagram.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Diagram } from "../../src/components/Diagram.js";

vi.mock("mermaid", () => ({
  default: { initialize: vi.fn(), render: vi.fn().mockResolvedValue({ svg: "<svg data-test='m'/>", bindFunctions: undefined }) },
}));

describe("Diagram", () => {
  it("renders mermaid output into the DOM", async () => {
    render(<Diagram slotId="s" slotVersion={1} props={{ source: "graph TD; A-->B" }} />);
    await waitFor(() => expect(screen.getByTestId("m")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Implement**

```tsx
// packages/ui/src/components/Diagram.tsx
import { useEffect, useRef } from "react";
import mermaid from "mermaid";
import { DiagramPropsSchema, type DiagramProps } from "@interactive-learning/protocol";
import { sendUserEvent } from "../state/use-ws.js";

mermaid.initialize({ startOnLoad: false, securityLevel: "strict" });

export function Diagram({ slotId, slotVersion, props }: { slotId: string; slotVersion: number; props: DiagramProps }) {
  const parsed = DiagramPropsSchema.parse(props);
  const ref = useRef<HTMLDivElement>(null);
  const slot = { id: slotId, version: slotVersion };

  useEffect(() => {
    let cancelled = false;
    const id = `mermaid-${slotId}-${slotVersion}`;
    mermaid.render(id, parsed.source).then(({ svg }) => {
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = svg;
      const nodes = ref.current.querySelectorAll(".node").length;
      const edges = ref.current.querySelectorAll(".edgePath").length;
      sendUserEvent("diagram.rendered", slot, { nodes, edges });
      ref.current.querySelectorAll<HTMLElement>(".node").forEach((el) => {
        el.style.cursor = "pointer";
        el.addEventListener("click", () => {
          const nodeId = el.id || "";
          sendUserEvent("diagram.node_clicked", slot, { node_id: nodeId });
        });
      });
    }).catch(() => { if (ref.current) ref.current.innerText = "Diagram render error"; });
    return () => { cancelled = true; };
  }, [parsed.source, slotId, slotVersion]);

  return (
    <figure className="my-4">
      <div ref={ref} role="img" aria-label="diagram" />
      {parsed.caption && <figcaption className="text-sm text-muted-foreground mt-2">{parsed.caption}</figcaption>}
    </figure>
  );
}
```

- [ ] **Step 3: Commit**

Add to `register.ts` importing `DiagramPropsSchema` from `@interactive-learning/protocol`.

```bash
git commit -am "feat(ui): Diagram component with Mermaid v11 strict security"
```

---

## Task U.10 — Component: `Hint` / `Reveal`

**Files:**
- Create: `packages/ui/src/components/Hint.tsx`
- Create: `packages/ui/tests/components/Hint.test.tsx`

> Schema lives in `@interactive-learning/protocol` (F.2 Step 9).

- [ ] **Step 1: Test**

```tsx
// packages/ui/tests/components/Hint.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Hint } from "../../src/components/Hint.js";

vi.mock("../../src/state/use-ws.js", () => ({ sendUserEvent: vi.fn() }));
const { sendUserEvent } = await import("../../src/state/use-ws.js");

describe("Hint", () => {
  it("emits hint.revealed when user clicks reveal", async () => {
    render(<Hint slotId="s" slotVersion={1} props={{ content: "Answer: 42" }} />);
    await userEvent.click(screen.getByRole("button", { name: /hint/i }));
    expect(sendUserEvent).toHaveBeenCalledWith("hint.revealed", expect.anything(), {});
    expect(screen.getByText("Answer: 42")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement using Radix Collapsible**

```tsx
// packages/ui/src/components/Hint.tsx
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible.js";
import { Button } from "./ui/button.js";
import { HintPropsSchema, type HintProps } from "@interactive-learning/protocol";
import { sendUserEvent } from "../state/use-ws.js";
import { Markdown } from "./Markdown.js";

export function Hint({ slotId, slotVersion, props }: { slotId: string; slotVersion: number; props: HintProps }) {
  const parsed = HintPropsSchema.parse(props);
  const [open, setOpen] = useState(false);
  const slot = { id: slotId, version: slotVersion };

  const onOpenChange = (next: boolean) => {
    if (next && !open) sendUserEvent("hint.revealed", slot, {});
    setOpen(next);
  };

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm">{parsed.label}</Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 rounded border p-2 bg-muted/30">
        <Markdown slotId={`${slotId}:hint`} slotVersion={slotVersion} props={{ content: parsed.content }} />
      </CollapsibleContent>
    </Collapsible>
  );
}
```

- [ ] **Step 3: Commit**

Add to `register.ts` importing `HintPropsSchema` from `@interactive-learning/protocol`.

```bash
git commit -am "feat(ui): Hint/Reveal with Radix Collapsible"
```

---

## Task U.11 — `/closed` session-ended page

**Files:**
- Modify: `packages/ui/src/App.tsx` (router or conditional render)
- Create: `packages/ui/src/pages/SessionClosed.tsx`

- [ ] **Step 1: Implement**

```tsx
// packages/ui/src/pages/SessionClosed.tsx
export function SessionClosed() {
  return (
    <main className="min-h-screen grid place-items-center p-8 text-center space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Session ended</h1>
        <p className="text-sm text-muted-foreground mt-2">You can close this tab. Phase 2 will let you export this session.</p>
        <button disabled className="mt-4 rounded border px-3 py-1 text-sm opacity-50 cursor-not-allowed">
          Export session (Phase 2)
        </button>
      </div>
    </main>
  );
}
```

```tsx
// packages/ui/src/App.tsx (update)
import { useSessionStore } from "./state/session-store.js";
// ...
function Root() {
  useSessionWebSocket();
  const slots = useSessionStore((s) => s.slots);
  const sessionEnded = slots.some((s) => s.slot_id === "__session_ended__");
  if (window.location.pathname === "/closed" || sessionEnded) return <SessionClosed />;
  return <SessionRoot />;
}
```

> The server emits a `session.ended` event in `end_session`; the UI watches for it in `onRemoteEvent` and flips a flag in the store (add `sessionEnded` field).

- [ ] **Step 2: Update store + test**

Add `sessionEnded` to `useSessionStore` and set in `onRemoteEvent` when `e.type === "session.ended"`. Add a short test in `session-store.test.ts`.

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(ui): session-ended page wired to session.ended event"
```

---

## Task U.12 — Reconnect + reconcile via `session://current/state`

**Files:**
- Modify: `packages/ui/src/state/use-ws.ts` (on open, fetch snapshot)
- Create: `packages/ui/src/state/fetch-snapshot.ts`

- [ ] **Step 1: Snapshot fetcher**

```ts
// packages/ui/src/state/fetch-snapshot.ts
import { SessionSnapshotSchema, type SessionSnapshot } from "@interactive-learning/protocol";

export async function fetchSessionSnapshot(): Promise<SessionSnapshot> {
  const r = await fetch("/session/state");
  const raw = await r.json();
  return SessionSnapshotSchema.parse(raw);
}
```

- [ ] **Step 2: Server — expose `/session/state` HTTP endpoint**

Modify `packages/mcp-server/src/http.ts` to add:
```ts
fastify.get("/session/state", async () => deps.store.snapshot());
```
(Test: add to `http.test.ts`.)

- [ ] **Step 3: Wire on WS open**

In `use-ws.ts`:
```ts
ws.onopen = async () => {
  setConn(true);
  backoff = 500;
  try {
    const snap = await fetchSessionSnapshot();
    useSessionStore.getState().applySnapshot(snap);
  } catch {}
};
```

- [ ] **Step 4: Test — reconcile after simulated reconnect**

Write `packages/ui/tests/state/reconnect.test.ts` verifying that after applySnapshot + onRemoteEvent sequence, slots match the snapshot.

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(ui): reconnect with snapshot reconcile via /session/state"
```

---

## Task U.13 — Global `window.onerror` → `session.uncaught_error`

**Files:**
- Modify: `packages/ui/src/main.tsx`
- Create: `packages/ui/src/state/global-errors.ts`

- [ ] **Step 1: Implement**

```ts
// packages/ui/src/state/global-errors.ts
import { sendUserEvent } from "./use-ws.js";

export function attachGlobalErrorHandlers(): void {
  window.addEventListener("error", (e) => {
    sendUserEvent("session.uncaught_error", { id: "__session__", version: 0 }, { message: e.message });
  });
  window.addEventListener("unhandledrejection", (e) => {
    sendUserEvent("session.uncaught_error", { id: "__session__", version: 0 }, { message: String(e.reason) });
  });
}
```

In `main.tsx`, call `attachGlobalErrorHandlers()` right after mount.

- [ ] **Step 2: Commit**

```bash
git commit -am "feat(ui): push session.uncaught_error on global errors"
```

---

# Integration & delivery tasks

## Task I.1–I.3 — Example course packs

Create three packs under `packages/examples/`. Each validates against the `validate` CLI.

**Directories:**
- `packages/examples/python-decorators/`
- `packages/examples/history-silk-road/`
- `packages/examples/geometry-triangles/`

- [ ] **Step 1 (per pack): Create `meta.mjs`, `index.mdx`, `quiz.yaml`**

Example `python-decorators/meta.mjs`:
```js
export default {
  id: "python-decorators",
  title: "Python Decorators",
  summary: "Learn @decorator syntax, closures, and @staticmethod vs @classmethod",
  objectives: [
    "Explain what a decorator is",
    "Write a simple @timer decorator",
    "Distinguish @staticmethod and @classmethod",
  ],
  est_minutes: 25,
  language: "en",
  difficulty: "intermediate",
  tags: ["python", "meta-programming"],
  agent_hints: {
    teaching_style: "example_first",
    key_moments: ["after-quiz-q2-staticmethod-confusion"],
  },
};
```

Example `python-decorators/index.mdx`:
```mdx
# Python Decorators

A decorator is a function that takes a function and returns another function...

<Quiz questions={[
  { id: "q1", kind: "single_choice", prompt: "A function that returns a function is called:",
    options: [{ id: "a", label: "Callback" }, { id: "b", label: "Higher-order function", is_correct: true }] },
]} reveal_mode="on_submit" />
```

- [ ] **Step 2: Run validator**

```bash
node packages/cli/bin/validate.js packages/examples/python-decorators
# expect: ✓ valid
```

- [ ] **Step 3: Commit each**

```bash
git add packages/examples/python-decorators
git commit -m "feat(examples): python-decorators course pack"
# repeat for history-silk-road, geometry-triangles
```

---

## Task I.4 — `@interactive-learning/skills` single-source + Claude Code dist

**Files:**
- Create: `packages/skills/package.json`
- Create: `packages/skills/src/skill.md` (single source)
- Create: `packages/skills/src/build.ts` (renders dists)
- Create: `packages/skills/dist/claude-code/interactive-learning/SKILL.md` (generated)
- Create: `packages/skills/tests/build.test.ts`

- [ ] **Step 1: Single-source skill content**

```md
<!-- packages/skills/src/skill.md -->
# Interactive Learning

Drive a declarative educational UI in the user's browser via MCP tools. Use when the user wants to "interactively learn X", "run a lesson", "/start_lesson", or create/consume a course pack.

## When to use

- Yes: "teach me X interactively", "run a lesson on X", `/start_lesson <path>`, "create a course pack".
- No: a one-off definition, debugging, non-educational requests.

## Consumer loop

1. Read `<path>/meta.ts` (or `meta.mjs`) — lesson frame.
2. Read `<path>/index.mdx` — lesson body.
3. Read any YAML side-cars referenced by the MDX.
4. Read resource `catalog://components` exactly once per session.
5. Call `render_component` to display the first screen.
6. Loop:
   - `wait_for_event(timeout_ms: 25000)` — returns events or empty on timeout.
   - On empty, call it again immediately (never sleep in client).
   - On events, reason about them, then `render_component` or `update_component`.
7. When done, call `end_session({ reason })`.

## Creator loop

1. Align objectives with the user (1–6 concrete objectives).
2. Write `meta.ts` conforming to `LessonMetaSchema`.
3. Write `index.mdx`; embed `<Quiz>`, `<FlashCard>`, etc. from the catalog.
4. Move quiz/flashcard data into `quiz.yaml` / `flashcards.yaml` where it reduces noise.
5. Run `npx @interactive-learning/cli validate <path>`.

## Anti-patterns

- Never tight-loop render without waiting on events.
- Never re-read `catalog://components` inside the loop.
- Never block longer than 25s in a single tool call.
- Never invent component types not in the catalog.
- Never swallow Zod errors — read `error.data.issues[].path` and fix props.

## Error recovery

- Validation error → inspect `path`/`expected` → fix props → retry once.
- Browser disconnect → server keeps state for 5 minutes → re-render the latest screen if user returns.
- Idle > 30 min → session terminates; offer to open a fresh one.
```

- [ ] **Step 2: Build script**

```ts
// packages/skills/src/build.ts
import fs from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("src/skill.md");
const CLAUDE_CODE_OUT = path.resolve("dist/claude-code/interactive-learning/SKILL.md");

const FRONTMATTER = `---
name: interactive-learning
description: Use when the user wants interactive learning, lessons, or creating/consuming course packs.
---

`;

export async function buildSkills(): Promise<void> {
  const body = await fs.readFile(SRC, "utf8");
  await fs.mkdir(path.dirname(CLAUDE_CODE_OUT), { recursive: true });
  await fs.writeFile(CLAUDE_CODE_OUT, FRONTMATTER + body, "utf8");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildSkills().catch((e) => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 3: Test**

```ts
// packages/skills/tests/build.test.ts
import { describe, it, expect } from "vitest";
import fs from "node:fs/promises";
import { buildSkills } from "../src/build.js";

describe("buildSkills", () => {
  it("emits claude-code SKILL.md with frontmatter", async () => {
    await buildSkills();
    const body = await fs.readFile("dist/claude-code/interactive-learning/SKILL.md", "utf8");
    expect(body).toMatch(/^---\nname: interactive-learning/);
    expect(body).toMatch(/Consumer loop/);
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add packages/skills
git commit -m "feat(skills): single-source skill.md + Claude Code dist builder"
```

---

## Task I.5 — Playwright E2E full agent loop

Drive the built app against a real MCP stdio child process, simulate the agent via the MCP SDK client, and assert full round-trip.

**Files:**
- Create: `packages/e2e/package.json`
- Create: `packages/e2e/playwright.config.ts`
- Create: `packages/e2e/tests/full-loop.spec.ts`

- [ ] **Step 1: Manifest**

```json
{
  "name": "@interactive-learning/e2e",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@interactive-learning/protocol": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@playwright/test": "^1.48.0"
  }
}
```

- [ ] **Step 2: `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: { headless: true },
  webServer: undefined, // we spin up MCP server manually
  reporter: "list",
});
```

- [ ] **Step 3: E2E spec**

```ts
// packages/e2e/tests/full-loop.spec.ts
import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("render Quiz → user clicks → agent receives quiz.answer_submitted", async ({ page }) => {
  const child = spawn("node", ["../mcp-server/bin/server.js"], { stdio: ["pipe", "pipe", "inherit"] });
  const transport = new StdioClientTransport({ command: "node", args: ["../mcp-server/bin/server.js"] });
  const client = new Client({ name: "e2e", version: "0" });
  await client.connect(transport);

  // 1. Render a Quiz
  const rendered = JSON.parse((await client.callTool({
    name: "render_component",
    arguments: { type: "Quiz", props: { questions: [
      { id: "q1", kind: "single_choice", prompt: "Pick B",
        options: [{ id: "a", label: "A" }, { id: "b", label: "B", is_correct: true }] },
    ], reveal_mode: "on_submit", allow_retry: true }},
  })).content[0].text) as { slot_id: string; cursor: string };

  // 2. Open the browser tab (lazy-started by the tool call)
  await page.goto("http://127.0.0.1:7654/");
  await page.getByLabel("B").click();
  await page.getByRole("button", { name: /submit/i }).click();

  // 3. Agent waits for events
  const events = JSON.parse((await client.callTool({
    name: "wait_for_event",
    arguments: { since_cursor: rendered.cursor, timeout_ms: 5000 },
  })).content[0].text) as { events: Array<{ type: string }> };

  expect(events.events.map((e) => e.type)).toContain("quiz.all_submitted");

  await client.close();
  child.kill();
});
```

- [ ] **Step 4: Add more scenarios**

Add specs covering the remaining mandatory E2E list from RPD §7.3: FlashCard flip/rate, StepByStep mark-done, Diagram render event, Hint reveal, reconnect reconcile, cursor catch-up, slot-version filter, idle timeout (via fake timer injection), Zod validation error, port collision.

- [ ] **Step 5: Commit**

```bash
git add packages/e2e
git commit -m "test(e2e): full agent-browser loop with Playwright + MCP SDK"
```

---

## Task I.6 — GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1:**

```yaml
name: CI
on: { push: { branches: [main] }, pull_request: {} }
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        node: [20, 22]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: ${{ matrix.node }}, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm --filter @interactive-learning/ui build
      - run: pnpm --filter @interactive-learning/mcp-server build
      - if: matrix.os == 'ubuntu-latest' && matrix.node == 22
        run: pnpm --filter @interactive-learning/e2e exec playwright install --with-deps
      - if: matrix.os == 'ubuntu-latest' && matrix.node == 22
        run: pnpm --filter @interactive-learning/e2e test:e2e
```

- [ ] **Step 2: Commit**

```bash
git add .github
git commit -m "ci: Node 20/22 × macOS/Ubuntu matrix with typecheck, lint, tests, E2E"
```

---

## Task I.7 — Top-level README + CONTRIBUTING

**Files:**
- Create: `README.md` (zh-CN + en sections)
- Create: `CONTRIBUTING.md`

Content outline (README):
- One-paragraph pitch.
- Install (3 agents).
- Quick start (`/start_lesson ~/courses/decorators`).
- Authoring a course pack.
- License (suggest Apache 2.0).

- [ ] **Step 1: Draft both files based on RPD §1 + BRAINSTORMING §6.3 install matrix.**
- [ ] **Step 2: Commit**

```bash
git commit -am "docs: top-level README (zh-CN + en) and CONTRIBUTING"
```

---

## Task I.8 — Release checklist (v0.1 demo acceptance)

**Files:**
- Create: `docs/release-v0.1.md`

Translate RPD §7.1 into a checklist that the maintainer runs manually before tagging `v0.1.0`:

- [ ] Clean macOS machine + latest Claude Code
- [ ] `claude mcp add interactive-learning -- npx -y @interactive-learning/mcp`
- [ ] Copy `@interactive-learning/skills/dist/claude-code/interactive-learning/SKILL.md` to `~/.claude/skills/interactive-learning/`
- [ ] `/start_lesson packages/examples/python-decorators` (absolute path)
- [ ] Browser auto-opens
- [ ] Quiz renders; submit; FlashCard appears; rate cards; StepByStep appears
- [ ] Close tab → re-open → state reconciles
- [ ] Repeat in Codex CLI with TOML snippet (manual step)
- [ ] Run `pnpm test` — green
- [ ] Run `pnpm --filter @interactive-learning/e2e test:e2e` — green
- [ ] Tag and `pnpm publish` (dry-run first)

Commit:
```bash
git commit -am "docs: v0.1 release acceptance checklist"
```

---

# Self-review (do this at end of implementation, not as part of plan)

Run these checks when all tasks are complete:

- [ ] Every FR-* from RPD §4 maps to at least one task above.
- [ ] Every must-cover E2E scenario from RPD §7.3 has a Playwright spec in Task I.5.
- [ ] No `any`, no TODO/FIXME in merged code (grep `rg -n 'any |TODO|FIXME' packages/`).
- [ ] `pnpm test` runs in < 30s; `pnpm --filter e2e test:e2e` runs in ≤ 2 min.
- [ ] `pnpm typecheck` + `pnpm lint` both clean.
- [ ] Clean-machine demo passes the Task I.8 checklist end-to-end.

---

# Execution handoff

**Plan saved to `PLAN.md`. Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task group (Foundation → Server → UI → Integration), review between groups, fast iteration.
2. **Inline Execution** — execute tasks in this session sequentially with checkpoints after every 3–5 tasks.

Say **"subagent"** or **"inline"** to start. You can also point at a specific task (e.g. "start with F.1 and F.2 only") if you want to bootstrap incrementally.
