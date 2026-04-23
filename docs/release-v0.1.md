# v0.1 release acceptance checklist

Run through this on a clean machine before tagging `v0.1.0`. Each item must pass unaided.

## Prerequisites

- [ ] macOS or Linux host with Node 20 or 22 and pnpm 9 installed
- [ ] Latest Claude Code installed (`claude --version`)
- [ ] Port 7654 available

## Install

- [ ] `claude mcp add interactive-learning -- npx -y @interactive-learning/mcp-server`
- [ ] `cp -r packages/skills/dist/claude-code/interactive-learning ~/.claude/skills/`
- [ ] Restart Claude Code so the skill is loaded

## Quiz flow (python-decorators)

- [ ] From Claude Code: `/start_lesson /absolute/path/to/packages/examples/python-decorators`
- [ ] Browser tab opens automatically at `http://127.0.0.1:7654/`
- [ ] Lesson markdown renders
- [ ] Quiz appears; selecting an option and clicking **Submit** shows the explanation and sends events back to the agent

## FlashCard and StepByStep

- [ ] FlashCard deck renders; flip and rate cards; `deck_completed` event fires after last card
- [ ] StepByStep accordion renders; expand / collapse / mark-done events fire

## Reconnect

- [ ] Close the browser tab
- [ ] Re-open `http://127.0.0.1:7654/` — the last rendered slot is reconciled via `/session/state`

## Codex CLI

- [ ] Repeat the `/start_lesson` flow from Codex CLI (manual step; add the MCP server per Codex docs)

## Quality gates

- [ ] `pnpm test` — green across all workspace packages
- [ ] `pnpm --filter @interactive-learning/e2e test:e2e` — green (requires `pnpm exec playwright install chromium` first)
- [ ] `pnpm typecheck` — clean
- [ ] `pnpm lint` — clean
- [ ] `pnpm --filter @interactive-learning/mcp-server build` — clean
- [ ] `pnpm --filter @interactive-learning/ui build` — clean (emits into `packages/mcp-server/spa/`)

## Tag and publish

- [ ] `git tag v0.1.0`
- [ ] `pnpm publish --dry-run` — no surprises
- [ ] `pnpm publish`
- [ ] Push tag: `git push origin v0.1.0`
