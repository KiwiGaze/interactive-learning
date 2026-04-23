import { z } from "zod";

export const FlashCardPropsSchema = z.object({
  deck_id: z.string(),
  cards: z.array(
    z.object({
      id: z.string(),
      front: z.string(),
      back: z.string(),
      tags: z.array(z.string()).optional(),
    }),
  ),
  mode: z.enum(["study", "review"]).default("study"),
  show_progress: z.boolean().default(true),
});
export type FlashCardProps = z.infer<typeof FlashCardPropsSchema>;

export const FlashCardEventSchemas = {
  "flashcard.flipped": z.object({ card_id: z.string() }),
  "flashcard.rated": z.object({
    card_id: z.string(),
    rating: z.enum(["again", "hard", "good", "easy"]),
  }),
  "flashcard.deck_completed": z.object({ card_ids_seen: z.array(z.string()) }),
} as const;
