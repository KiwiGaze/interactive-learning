import type { QuizProps } from "@interactive-learning/protocol";
import { QuizPropsSchema } from "@interactive-learning/protocol";
import { useState } from "react";
import { sendUserEvent } from "../state/use-ws.js";
import { Button } from "./ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.js";

export function Quiz({
  slotId,
  slotVersion,
  props,
}: { slotId: string; slotVersion: number; props: unknown }) {
  const parsed: QuizProps = QuizPropsSchema.parse(props);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const slot = { id: slotId, version: slotVersion };

  const setAnswer = (qid: string, value: string): void => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    sendUserEvent("quiz.answer_submitted", slot, { question_id: qid, value });
  };

  const onSubmit = (): void => {
    setSubmitted(true);
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
        {parsed.questions.map((q) => (
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
                      disabled={submitted && !parsed.allow_retry}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            ) : null}
            {q.kind === "short_answer" ? (
              <input
                type="text"
                className="w-full rounded border border-slate-300 px-2 py-1"
                onChange={(e) => setAnswer(q.id, e.target.value)}
                disabled={submitted && !parsed.allow_retry}
              />
            ) : null}
            {submitted && parsed.reveal_mode !== "never" && q.explanation ? (
              <p className="text-sm text-slate-600">{q.explanation}</p>
            ) : null}
          </fieldset>
        ))}
        <Button onClick={onSubmit} disabled={submitted && !parsed.allow_retry}>
          Submit
        </Button>
      </CardContent>
    </Card>
  );
}
