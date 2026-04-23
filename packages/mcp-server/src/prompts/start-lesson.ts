export const START_LESSON_PROMPT = {
  name: "start_lesson",
  description: "Load and begin a local course pack.",
  arguments: [{ name: "path", description: "Absolute or ~ path to lesson dir", required: true }],
} as const;

export function startLessonPrompt(args: { path: string }) {
  return {
    messages: [
      {
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
      },
    ],
  };
}
