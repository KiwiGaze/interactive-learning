import {
  DiagramPropsSchema,
  FlashCardPropsSchema,
  HintPropsSchema,
  MarkdownPropsSchema,
  QuizPropsSchema,
  StepByStepPropsSchema,
} from "@interactive-learning/protocol";
import { Diagram } from "../components/Diagram.js";
import { FlashCard } from "../components/FlashCard.js";
import { Hint } from "../components/Hint.js";
import { Markdown } from "../components/Markdown.js";
import { Quiz } from "../components/Quiz.js";
import { StepByStep } from "../components/StepByStep.js";
import { UI_CATALOG } from "./catalog.js";

UI_CATALOG.register({ type: "Markdown", Component: Markdown, propsSchema: MarkdownPropsSchema });
UI_CATALOG.register({ type: "Quiz", Component: Quiz, propsSchema: QuizPropsSchema });
UI_CATALOG.register({ type: "FlashCard", Component: FlashCard, propsSchema: FlashCardPropsSchema });
UI_CATALOG.register({
  type: "StepByStep",
  Component: StepByStep,
  propsSchema: StepByStepPropsSchema,
});
UI_CATALOG.register({ type: "Diagram", Component: Diagram, propsSchema: DiagramPropsSchema });
UI_CATALOG.register({ type: "Hint", Component: Hint, propsSchema: HintPropsSchema });
