import type { Card, Word } from "../types";

type Props = {
  card: Card;
  word: Word;
  flipped: boolean;
  onFlip: () => void;
};

export function CardView({ card, word, flipped, onFlip }: Props) {
  const isEsToEn = card.direction === "es-to-en";
  const front = isEsToEn ? word.spanish : word.english;
  const back = isEsToEn ? word.english : word.spanish;
  const exampleLang = isEsToEn ? "Spanish" : "Spanish";

  return (
    <button
      onClick={onFlip}
      className="w-full bg-white rounded-2xl shadow-lg p-8 min-h-[280px] flex flex-col items-center justify-center text-center active:scale-[0.99] transition"
    >
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">
        {isEsToEn ? "Spanish → English" : "English → Spanish"}
      </div>
      <div className="text-4xl font-bold text-slate-900">{front}</div>

      {flipped ? (
        <div className="mt-6 pt-6 border-t border-slate-200 w-full space-y-2">
          <div className="text-3xl font-semibold text-emerald-700">{back}</div>
          {word.pos && (
            <div className="text-sm text-slate-500 italic">{word.pos}</div>
          )}
          {word.example && (
            <div className="text-sm text-slate-600 mt-3">
              <span className="block text-xs uppercase text-slate-400 mb-1">
                Example ({exampleLang})
              </span>
              {word.example}
            </div>
          )}
          {word.category && (
            <div className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
              {word.category}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 text-xs text-slate-400">Tap to reveal</div>
      )}
    </button>
  );
}
