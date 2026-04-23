# Interactive Learning

An MCP-server middleware + browser SPA that lets local AI coding agents (Claude Code, Codex, Cursor) drive interactive educational UIs. Agents use tools to render declarative components — Quiz, FlashCard, StepByStep, Diagram, Markdown, Hint — in the user's browser; the browser streams user events back for the agent to reason over.

## English

### Quick start

1. **Install the MCP server** in your agent of choice. For Claude Code:
   ```bash
   claude mcp add interactive-learning -- npx -y @interactive-learning/mcp-server
   ```
2. **Install the skill** (one-time):
   ```bash
   cp -r packages/skills/dist/claude-code/interactive-learning ~/.claude/skills/
   ```
3. **Start a lesson** from inside your agent:
   ```
   /start_lesson /absolute/path/to/packages/examples/python-decorators
   ```
   A browser tab opens automatically at `http://127.0.0.1:7654/`.

### What's inside

- `packages/protocol` — Zod schemas shared between server and UI (single source of truth)
- `packages/mcp-server` — stdio MCP server + Fastify HTTP + WebSocket
- `packages/ui` — Vite + React 19 + Tailwind v4 SPA
- `packages/cli` — `interactive-learning-validate` for course packs
- `packages/skills` — skill markdown distributed to Claude Code
- `packages/examples` — three example course packs
- `packages/e2e` — Playwright end-to-end tests

### Authoring a course pack

A course pack is a directory with:

- `meta.mjs` — frontmatter validated against `LessonMetaSchema`
- `index.mdx` — narrative body (no JSX attribute expressions; whitelisted components only)
- `quiz.yaml` / `flashcards.yaml` — optional side-car data

Validate with:
```bash
pnpm --filter @interactive-learning/cli build
node packages/cli/bin/validate.js /path/to/your/pack
```

### License

Apache 2.0 (suggested).

---

## 中文

### 快速开始

1. 在代理中安装 MCP 服务器。以 Claude Code 为例：
   ```bash
   claude mcp add interactive-learning -- npx -y @interactive-learning/mcp-server
   ```
2. 安装技能（一次性）：
   ```bash
   cp -r packages/skills/dist/claude-code/interactive-learning ~/.claude/skills/
   ```
3. 启动课程：
   ```
   /start_lesson /absolute/path/to/packages/examples/python-decorators
   ```

### 仓库结构

- `packages/protocol` — 共享 Zod schemas
- `packages/mcp-server` — MCP 服务端 + HTTP + WebSocket
- `packages/ui` — React 19 SPA
- `packages/cli` — 课程包校验 CLI
- `packages/skills` — 技能 markdown
- `packages/examples` — 示例课程包
- `packages/e2e` — Playwright 测试

### 编写课程包

目录结构：
- `meta.mjs` — 由 `LessonMetaSchema` 校验
- `index.mdx` — 主体内容
- `quiz.yaml` / `flashcards.yaml` — 可选的侧车数据

验证：
```bash
node packages/cli/bin/validate.js /path/to/your/pack
```
