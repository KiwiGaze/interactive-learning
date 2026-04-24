import type { FlashCardProps } from "@interactive-learning/protocol";
import { FlashCardPropsSchema } from "@interactive-learning/protocol";
import { useState } from "react";
import { sendUserEvent } from "../state/use-ws.js";
import { Button } from "./ui/button.js";
import { Card, CardContent } from "./ui/card.js";
import { Progress } from "./ui/progress.js";

type Rating = "again" | "hard" | "good" | "easy";

function flipClasses(flipped: boolean): string {
  const base = "relative min-h-24 [transform-style:preserve-3d] transition-transform duration-300";
  if (flipped) return `${base} [transform:rotateY(180deg)]`;
  return base;
}

export function FlashCard({
  slotId,
  slotVersion,
  props,
}: { slotId: string; slotVersion: number; props: unknown }) {
  const parsed: FlashCardProps = FlashCardPropsSchema.parse(props);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const slot = { id: slotId, version: slotVersion };
  const card = parsed.cards[index];
  if (!card) return null;

  const flip = (): void => {
    if (!flipped) sendUserEvent("flashcard.flipped", slot, { card_id: card.id });
    setFlipped(true);
  };

  const rate = (rating: Rating): void => {
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
    <Card>
      <CardContent className="space-y-4">
        <div className="perspective-[1000px]">
          <div data-state={flipped ? "flipped" : "front"} className={flipClasses(flipped)}>
            <div
              aria-hidden={flipped}
              className="absolute inset-0 rounded border border-border p-4 [backface-visibility:hidden]"
            >
              {card.front}
            </div>
            <div
              aria-hidden={!flipped}
              className="absolute inset-0 rounded border border-border p-4 [backface-visibility:hidden] [transform:rotateY(180deg)]"
            >
              {card.back}
            </div>
          </div>
        </div>
        {!flipped ? (
          <Button onClick={flip}>Flip</Button>
        ) : (
          <div className="flex gap-2">
            {(["again", "hard", "good", "easy"] as const).map((r) => (
              <Button key={r} variant="outline" onClick={() => rate(r)}>
                {r}
              </Button>
            ))}
          </div>
        )}
        {parsed.show_progress ? (
          <Progress value={((index + (flipped ? 0.5 : 0)) / parsed.cards.length) * 100} />
        ) : null}
      </CardContent>
    </Card>
  );
}
