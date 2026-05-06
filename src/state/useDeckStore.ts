import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Card, Grade, Word } from "../types";
import { applyGrade, newCard } from "../lib/sm2";
import { isDue, todayIso } from "../lib/date";
import {
  findOrCreateGist,
  pullGist,
  pushGist,
  verifyToken,
} from "../lib/gist";

type State = {
  words: Word[];
  cards: Record<string, Card>;
  introducedWordIds: string[];
  lastReviewDate: string | null;
  reviewedToday: number;
  syncToken: string | null;
  syncGistId: string | null;
  syncLogin: string | null;
  lastPushedAt: string | null;
  lastPulledAt: string | null;
};

type Actions = {
  importWords: (words: Word[]) => { added: number; updated: number };
  addNewBatch: (count: number) => number;
  gradeCard: (cardId: string, grade: Grade) => void;
  resetAll: () => void;
  exportJson: () => string;
  importJson: (text: string) => boolean;
  dueCardIds: (today?: string) => string[];
  connectSync: (token: string) => Promise<void>;
  disconnectSync: () => void;
  pushToCloud: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
};

export type DeckStore = State & Actions;

const initialState: State = {
  words: [],
  cards: {},
  introducedWordIds: [],
  lastReviewDate: null,
  reviewedToday: 0,
  syncToken: null,
  syncGistId: null,
  syncLogin: null,
  lastPushedAt: null,
  lastPulledAt: null,
};

function buildExport(s: State): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      words: s.words,
      cards: s.cards,
      introducedWordIds: s.introducedWordIds,
    },
    null,
    2,
  );
}

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

      resetAll: () =>
        set({
          ...initialState,
          syncToken: get().syncToken,
          syncGistId: get().syncGistId,
          syncLogin: get().syncLogin,
        }),

      exportJson: () => buildExport(get()),

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

      connectSync: async (token) => {
        const login = await verifyToken(token);
        const gistId = await findOrCreateGist(token);
        set({ syncToken: token, syncGistId: gistId, syncLogin: login });
      },

      disconnectSync: () =>
        set({ syncToken: null, syncGistId: null, syncLogin: null }),

      pushToCloud: async () => {
        const { syncToken, syncGistId } = get();
        if (!syncToken || !syncGistId) throw new Error("Not connected");
        await pushGist(syncToken, syncGistId, buildExport(get()));
        set({ lastPushedAt: new Date().toISOString() });
      },

      pullFromCloud: async () => {
        const { syncToken, syncGistId } = get();
        if (!syncToken || !syncGistId) throw new Error("Not connected");
        const text = await pullGist(syncToken, syncGistId);
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object")
          throw new Error("Cloud data is empty or invalid");
        set({
          words: Array.isArray(parsed.words) ? parsed.words : [],
          cards:
            parsed.cards && typeof parsed.cards === "object"
              ? parsed.cards
              : {},
          introducedWordIds: Array.isArray(parsed.introducedWordIds)
            ? parsed.introducedWordIds
            : [],
          lastPulledAt: new Date().toISOString(),
        });
      },
    }),
    {
      name: "leitner-spanish-app",
      version: 1,
    },
  ),
);
