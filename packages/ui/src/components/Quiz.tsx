import type { QuizProps } from "@interactive-learning/protocol";
import { QuizPropsSchema } from "@interactive-learning/protocol";
import { useState } from "react";
import { sendUserEvent } from "../state/use-ws.js";
import { Button } from "./ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.js";
import { Input } from "./ui/input.js";

type AnswerValue = string | string[];

function toggleSelection(
  selected: readonly string[],
  optionId: string,
  checked: boolean,
): string[] {
  if (checked) return [...selected, optionId];
  return selected.filter((id) => id !== optionId);
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value) => b.includes(value));
}

function isCorrect(
  question: QuizProps["questions"][number],
  value: AnswerValue | undefined,
): boolean | undefined {
  if (value === undefined) return undefined;
  if (question.options) {
    const correctOptions = question.options
      .filter((option) => option.is_correct)
      .map((option) => option.id);
    if (correctOptions.length > 0) {
      if (Array.isArray(value)) return arraysEqual(value, correctOptions);
      return correctOptions.length === 1 && correctOptions[0] === value;
    }
  }
  if (question.correct_answer !== undefined) {
    if (Array.isArray(question.correct_answer) && Array.isArray(value)) {
      return arraysEqual(value, question.correct_answer);
    }
    return question.correct_answer === value;
  }
  return undefined;
}

function correctnessClasses(correct: boolean): string {
  if (correct) return "text-sm font-medium text-green-700";
  return "text-sm font-medium text-red-700";
}

export function Quiz({
  slotId,
  slotVersion,
  props,
}: { slotId: string; slotVersion: number; props: unknown }) {
  const parsed: QuizProps = QuizPropsSchema.parse(props);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const slot = { id: slotId, version: slotVersion };

  const setAnswer = (qid: string, value: AnswerValue, emit = true): void => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    if (emit) sendUserEvent("quiz.answer_submitted", slot, { question_id: qid, value });
  };

  const onSubmit = (): void => {
    setSubmitted(true);
    for (const [questionId, value] of Object.entries(answers)) {
      sendUserEvent("quiz.answer_submitted", slot, { question_id: questionId, value });
    }
    sendUserEvent("quiz.all_submitted", slot, { answers });
  };

  return (
    <Card>
      {parsed.title ? (
        <CardHeader>
          <CardTitle>{parsed.title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className="space-y-4">
        {parsed.questions.map((q) => {
          const correctness = isCorrect(q, answers[q.id]);
          const showCorrectness =
            submitted && parsed.reveal_mode !== "never" && correctness !== undefined;
          return (
            <fieldset key={q.id} className="space-y-2">
              <legend className="font-medium">{q.prompt}</legend>
              {q.kind === "single_choice" && q.options ? (
                <div className="space-y-1">
                  {q.options.map((o) => (
                    <label
                      key={o.id}
                      htmlFor={`${slotId}-${q.id}-${o.id}`}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        id={`${slotId}-${q.id}-${o.id}`}
                        type="radio"
                        name={`${slotId}-${q.id}`}
                        value={o.id}
                        onChange={() => setAnswer(q.id, o.id)}
                        checked={answers[q.id] === o.id}
                        disabled={submitted && !parsed.allow_retry}
                      />
                      {o.label}
                    </label>
                  ))}
                </div>
              ) : null}
              {q.kind === "multi_choice" && q.options ? (
                <div className="space-y-1">
                  {q.options.map((o) => {
                    const currentAnswer = answers[q.id];
                    const selected: string[] = Array.isArray(currentAnswer) ? currentAnswer : [];
                    return (
                      <label
                        key={o.id}
                        htmlFor={`${slotId}-${q.id}-${o.id}`}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          id={`${slotId}-${q.id}-${o.id}`}
                          type="checkbox"
                          name={`${slotId}-${q.id}`}
                          value={o.id}
                          checked={selected.includes(o.id)}
                          onChange={(event) => {
                            setAnswer(q.id, toggleSelection(selected, o.id, event.target.checked));
                          }}
                          disabled={submitted && !parsed.allow_retry}
                        />
                        {o.label}
                      </label>
                    );
                  })}
                </div>
              ) : null}
              {q.kind === "short_answer" ? (
                <Input
                  type="text"
                  value={typeof answers[q.id] === "string" ? answers[q.id] : ""}
                  onChange={(e) => setAnswer(q.id, e.target.value, false)}
                  disabled={submitted && !parsed.allow_retry}
                />
              ) : null}
              {showCorrectness ? (
                <output className={correctnessClasses(correctness === true)}>
                  {correctness ? "Correct" : "Incorrect"}
                </output>
              ) : null}
              {submitted && parsed.reveal_mode !== "never" && q.explanation ? (
                <p className="text-sm text-muted-foreground">{q.explanation}</p>
              ) : null}
            </fieldset>
          );
        })}
        <Button onClick={onSubmit} disabled={submitted && !parsed.allow_retry}>
          Submit
        </Button>
      </CardContent>
    </Card>
  );
}
