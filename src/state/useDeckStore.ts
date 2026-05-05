import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Card, Grade, Word } from "../types";
import { applyGrade, newCard } from "../lib/sm2";
import { isDue, todayIso } from "../lib/date";

type State = {
  words: Word[];
  cards: Record<string, Card>;
  introducedWordIds: string[];
  lastReviewDate: string | null;
  reviewedToday: number;
};

type Actions = {
  importWords: (words: Word[]) => { added: number; updated: number };
  addNewBatch: (count: number) => number;
  gradeCard: (cardId: string, grade: Grade) => void;
  resetAll: () => void;
  exportJson: () => string;
  importJson: (text: string) => boolean;
  dueCardIds: (today?: string) => string[];
};

export type DeckStore = State & Actions;

const initialState: State = {
  words: [],
  cards: {},
  introducedWordIds: [],
  lastReviewDate: null,
  reviewedToday: 0,
};

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      importWords: (incoming) => {
        const { words } = get();
        const byId = new Map(words.map((w) => [w.id, w]));
        let added = 0;
        let updated = 0;
        for (const w of incoming) {
          if (byId.has(w.id)) {
            updated += 1;
            byId.set(w.id, { ...byId.get(w.id)!, ...w });
          } else {
            added += 1;
            byId.set(w.id, w);
          }
        }
        const merged = Array.from(byId.values()).sort(
          (a, b) => a.number - b.number,
        );
        set({ words: merged });
        return { added, updated };
      },

      addNewBatch: (count) => {
        const { words, introducedWordIds, cards } = get();
        const introducedSet = new Set(introducedWordIds);
        const next = words
          .filter((w) => !introducedSet.has(w.id))
          .slice(0, count);
        if (next.length === 0) return 0;

        const today = todayIso();
        const newCards: Record<string, Card> = { ...cards };
        for (const w of next) {
          const c1 = newCard(w.id, "es-to-en", today);
          const c2 = newCard(w.id, "en-to-es", today);
          newCards[c1.id] = c1;
          newCards[c2.id] = c2;
        }
        set({
          cards: newCards,
          introducedWordIds: [...introducedWordIds, ...next.map((w) => w.id)],
        });
        return next.length;
      },

      gradeCard: (cardId, grade) => {
        const { cards, lastReviewDate, reviewedToday } = get();
        const card = cards[cardId];
        if (!card) return;
        const today = todayIso();
        const updated = applyGrade(card, grade, today);
        const isNewDay = lastReviewDate !== today;
        set({
          cards: { ...cards, [cardId]: updated },
          lastReviewDate: today,
          reviewedToday: isNewDay ? 1 : reviewedToday + 1,
        });
      },

      resetAll: () => set({ ...initialState }),

      exportJson: () => {
        const { words, cards, introducedWordIds } = get();
        return JSON.stringify(
          { version: 1, words, cards, introducedWordIds },
          null,
          2,
        );
      },

      importJson: (text) => {
        try {
          const parsed = JSON.parse(text);
          if (!parsed || typeof parsed !== "object") return false;
          set({
            words: Array.isArray(parsed.words) ? parsed.words : [],
            cards:
              parsed.cards && typeof parsed.cards === "object"
                ? parsed.cards
                : {},
            introducedWordIds: Array.isArray(parsed.introducedWordIds)
              ? parsed.introducedWordIds
              : [],
          });
          return true;
        } catch {
          return false;
        }
      },

      dueCardIds: (today) => {
        const t = today ?? todayIso();
        const { cards } = get();
        return Object.values(cards)
          .filter((c) => isDue(c.dueDate, t))
          .map((c) => c.id);
      },
    }),
    {
      name: "leitner-spanish-app",
      version: 1,
    },
  ),
);
