# Contributing

Thanks for wanting to help. This is a pnpm workspace monorepo.

## Local setup

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
```

## Conventions

- TypeScript strict, no `any`
- Conventional commits scoped by package: `feat(mcp-server): ...`, `test(ui): ...`
- Biome handles formatting and import order
- All external input validated with Zod (v4)
- Tests use Vitest; UI tests use Testing Library + jsdom
- E2E tests use Playwright

## Where schemas live

Component prop schemas and event schemas live in `packages/protocol/src/components/`. The server imports them to validate tool inputs; the UI imports them to register renderable components. Do not duplicate schemas.

## Pull requests

1. Branch off `main`
2. Run `pnpm test`, `pnpm typecheck`, `pnpm lint` — all must pass
3. Update tests for new behavior
4. Keep commits scoped and clear; rebase before review
5. Do not add AI attribution (no `Co-Authored-By: Claude`, no "Generated with" lines)
