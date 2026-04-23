import {
  DiagramEventSchemas,
  DiagramPropsSchema,
  FlashCardEventSchemas,
  FlashCardPropsSchema,
  HintEventSchemas,
  HintPropsSchema,
  MarkdownEventSchemas,
  MarkdownPropsSchema,
  QuizEventSchemas,
  QuizPropsSchema,
  StepByStepEventSchemas,
  StepByStepPropsSchema,
} from "@interactive-learning/protocol";
import type { CatalogRegistry } from "./catalog.js";

export function registerDefaultCatalog(reg: CatalogRegistry): void {
  reg.register({ type: "Markdown", props: MarkdownPropsSchema, events: MarkdownEventSchemas });
  reg.register({ type: "Quiz", props: QuizPropsSchema, events: QuizEventSchemas });
  reg.register({ type: "FlashCard", props: FlashCardPropsSchema, events: FlashCardEventSchemas });
  reg.register({
    type: "StepByStep",
    props: StepByStepPropsSchema,
    events: StepByStepEventSchemas,
  });
  reg.register({ type: "Diagram", props: DiagramPropsSchema, events: DiagramEventSchemas });
  reg.register({ type: "Hint", props: HintPropsSchema, events: HintEventSchemas });
}
