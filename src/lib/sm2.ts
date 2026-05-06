import type { Card, Grade } from "../types";
import { addDays } from "./date";

const EASE_MIN = 1.3;
const EASE_DEFAULT = 2.5;

export function newCard(
  wordId: string,
  direction: Card["direction"],
  today: string,
): Card {
  return {
    id: `${wordId}:${direction}`,
    wordId,
    direction,
    state: "new",
    interval: 0,
    easeFactor: EASE_DEFAULT,
    repetitions: 0,
    dueDate: today,
    lastReviewed: null,
    lapses: 0,
  };
}

export function applyGrade(card: Card, grade: Grade, today: string): Card {
  const next: Card = { ...card, lastReviewed: today };

  if (grade === "wrong") {
    next.state = "learning";
    next.repetitions = 0;
    next.interval = 1;
    next.dueDate = addDays(today, 1);
    if (card.state === "review") {
      next.easeFactor = Math.max(EASE_MIN, card.easeFactor - 0.2);
      next.lapses = card.lapses + 1;
    }
    return next;
  }

  if (card.state === "new" || card.state === "learning") {
    if (grade === "hard") {
      next.state = "review";
      next.interval = 1;
      next.repetitions = 1;
      next.dueDate = addDays(today, 1);
      return next;
    }
    if (grade === "good") {
      next.state = "review";
      next.interval = 1;
      next.repetitions = 1;
      next.dueDate = addDays(today, 1);
      return next;
    }
    next.state = "review";
    next.interval = 4;
    next.repetitions = 1;
    next.dueDate = addDays(today, 4);
    return next;
  }

  if (grade === "hard") {
    next.easeFactor = Math.max(EASE_MIN, card.easeFactor - 0.15);
    next.interval = Math.max(1, Math.round(card.interval * 1.2));
    next.repetitions = card.repetitions + 1;
    next.dueDate = addDays(today, next.interval);
    return next;
  }

  if (grade === "good") {
    next.interval = Math.max(1, Math.round(card.interval * card.easeFactor));
    next.repetitions = card.repetitions + 1;
    next.dueDate = addDays(today, next.interval);
    return next;
  }

  next.easeFactor = card.easeFactor + 0.15;
  next.interval = Math.max(
    1,
    Math.round(card.interval * card.easeFactor * 1.3),
  );
  next.repetitions = card.repetitions + 1;
  next.dueDate = addDays(today, next.interval);
  return next;
}
