export type Word = {
  id: string;
  number: number;
  english: string;
  spanish: string;
  pos: string;
  category: string;
  example: string;
};

export type Direction = "es-to-en" | "en-to-es";
export type CardState = "new" | "learning" | "review";
export type Grade = "again" | "hard" | "good" | "easy";

export type Card = {
  id: string;
  wordId: string;
  direction: Direction;
  state: CardState;
  interval: number;
  easeFactor: number;
  repetitions: number;
  dueDate: string;
  lastReviewed: string | null;
  lapses: number;
};
