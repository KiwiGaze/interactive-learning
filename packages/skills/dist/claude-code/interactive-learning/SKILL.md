---
name: interactive-learning
description: Use when the user wants interactive learning, lessons, or creating/consuming course packs.
---

# Interactive Learning

Use this skill when the user wants to take a lesson, explore course packs, or when you need to render interactive components (quizzes, flashcards) during teaching.

## Overview

The interactive-learning MCP server exposes tools and resources that let you deliver structured lessons with live UI components. You read lesson content from course pack files, render components into the learner's browser, and wait for their responses before continuing.

## Consumer loop

1. Read `catalog://components` (resource) to discover available component types and their props schemas.
2. Call `start_lesson` with the lesson id to initialize a session and receive the lesson meta.
3. Present the lesson narrative from `index.mdx` as markdown prose.
4. When you reach a quiz or flashcard moment, call `render_component` with the appropriate type and props.
5. Call `wait_for_event` (up to 25 s) to receive the learner's interaction (answer submission, card flip).
6. Respond to their answer — confirm correct answers, explain incorrect ones — then continue.
7. Call `end_session` when the lesson objectives are complete.

## Tools

### render_component

Renders a UI component into the learner's browser and returns a `slot_id` and `cursor`.

```
type: string          — component type name (from catalog)
props: object         — validated against the component's props schema
slot_id?: string      — reuse a slot to replace an existing component
replace?: boolean     — if true, replace instead of append
```

Returns `{ slot_id, cursor }`.

### update_component

Applies a JSON Patch to a previously rendered component's props.

```
slot_id: string       — the slot to update
patch: JsonPatchOp[]  — RFC 6902 patch operations
```

Use this to reveal answers on a flashcard or mark a quiz option as correct/incorrect after grading.

### wait_for_event

Long-polls for learner interaction events. Always pass the `next_cursor` from the previous call as `since_cursor`.

```
since_cursor?: string  — poll only for events after this cursor
timeout_ms?: number    — default 25000, max 30000
```

Returns `{ events, next_cursor }`. Events carry `type` and `payload`.

Quiz events:

- `quiz.answer_submitted` with payload `{ question_id: string, value: unknown }`
- `quiz.all_submitted` with payload `{ answers: Record<string, unknown> }`

### end_session

Closes the session cleanly.

```
reason?: string  — optional exit note
```

## Resources

- `catalog://components` — JSON array of `{ type, propsSchema }` objects describing every renderable component.
- `session://current/state` — current session snapshot (rendered slots, event log).

## Course pack layout

Each course pack is a directory containing:

- `meta.mjs` — lesson metadata (id, title, summary, objectives, est_minutes, …)
- `index.mdx` — lesson prose in Markdown
- `quiz.yaml` — multiple-choice questions (optional)
- `flashcards.yaml` — front/back card pairs (optional)

The agent reads `quiz.yaml` or `flashcards.yaml` at runtime and passes the parsed data as `props` to `render_component`.

## Key moments

If `agent_hints.key_moments` is set in the lesson meta, slow down and check for confusion at those points. Example: `"after-quiz-q2-staticmethod-confusion"` means pause after question 2 and ask whether the distinction is clear before moving on.

## Teaching styles

Respect `agent_hints.teaching_style` when set:

- `example_first` — show working code or a concrete example before introducing the concept name
- `direct` — state the rule, then give the example
- `socratic` — ask the learner to reason through it before confirming
