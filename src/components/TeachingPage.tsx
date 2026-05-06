import { useMemo, useState } from "react";
import { useDeckStore } from "../state/useDeckStore";

type Props = {
  cardIds: string[];
  onDone: () => void;
};

export function TeachingPage({ cardIds, onDone }: Props) {
  const cards = useDeckStore((s) => s.cards);
  const words = useDeckStore((s) => s.words);
  const wordById = useMemo(
    () => new Map(words.map((w) => [w.id, w])),
    [words],
  );

  const [index, setIndex] = useState(0);

  const card = cards[cardIds[index]];
  const word = card ? wordById.get(card.wordId) : null;

  if (!card || !word) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <p className="text-slate-500">No cards to review.</p>
        <button
          onClick={onDone}
          className="mt-4 px-6 py-3 rounded-xl bg-slate-900 text-white font-medium"
        >
          Done
        </button>
      </div>
    );
  }

  const isLast = index === cardIds.length - 1;
  const isEsToEn = card.direction === "es-to-en";

  const next = () => {
    if (isLast) {
      onDone();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <a href="#/" className="text-slate-500 text-sm">
          ← Home
        </a>
        <div className="text-sm text-slate-500">
          Study · {index + 1} of {cardIds.length}
        </div>
      </header>

      <main className="flex-1 px-4 flex items-center">
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-5">
          <div className="text-xs uppercase tracking-wider text-slate-400 text-center">
            {isEsToEn ? "Spanish → English" : "English → Spanish"}
          </div>

          <div className="space-y-3 text-center">
            <div>
              <div className="text-xs uppercase text-slate-400 mb-1">
                Spanish
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {word.spanish}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-400 mb-1">
                English
              </div>
              <div className="text-2xl font-semibold text-emerald-700">
                {word.english}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-3">
            {word.pos && (
              <div>
                <div className="text-xs uppercase text-slate-400">
                  Part of speech
                </div>
                <div className="italic text-slate-700">{word.pos}</div>
              </div>
            )}
            {word.example && (
              <div>
                <div className="text-xs uppercase text-slate-400">Example</div>
                <div className="text-slate-700">{word.example}</div>
              </div>
            )}
            {word.category && (
              <div>
                <span className="inline-block text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  {word.category}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center pt-2">
            You'll see this one again tomorrow.
          </p>
        </div>
      </main>

      <footer className="p-4 pb-6 sticky bottom-0 bg-slate-50/90 backdrop-blur">
        <button
          onClick={next}
          className="w-full max-w-md mx-auto block py-4 rounded-xl bg-slate-900 text-white font-medium"
        >
          {isLast ? "Done" : "Next"}
        </button>
      </footer>
    </div>
  );
}
