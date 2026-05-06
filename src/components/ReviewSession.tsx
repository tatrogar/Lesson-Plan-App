import { useEffect, useMemo, useState } from "react";
import { useDeckStore } from "../state/useDeckStore";
import type { Grade } from "../types";
import { todayIso } from "../lib/date";
import { CardView } from "./CardView";
import { TeachingPage } from "./TeachingPage";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Phase = "review" | "teaching" | "done";

export function ReviewSession() {
  const cards = useDeckStore((s) => s.cards);
  const words = useDeckStore((s) => s.words);
  const gradeCard = useDeckStore((s) => s.gradeCard);

  const wordById = useMemo(
    () => new Map(words.map((w) => [w.id, w])),
    [words],
  );

  const [queue, setQueue] = useState<string[]>([]);
  const [missed, setMissed] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [phase, setPhase] = useState<Phase>("review");

  useEffect(() => {
    const today = todayIso();
    const due = Object.values(cards)
      .filter((c) => c.dueDate <= today)
      .map((c) => c.id);
    const initial = shuffle(due);
    setQueue(initial);
    if (initial.length === 0) setPhase("done");
  }, []);

  const currentId = queue[0];
  const card = currentId ? cards[currentId] : null;
  const word = card ? wordById.get(card.wordId) : null;

  const onGrade = (grade: Grade) => {
    if (!card) return;
    gradeCard(card.id, grade);
    if (grade === "wrong") {
      setMissed((m) => [...m, card.id]);
    }
    setQueue((q) => {
      const rest = q.slice(1);
      if (rest.length === 0) {
        const willHaveMissed =
          grade === "wrong" ? missed.length + 1 : missed.length;
        setPhase(willHaveMissed > 0 ? "teaching" : "done");
      }
      return rest;
    });
    setDone((d) => d + 1);
    setFlipped(false);
  };

  if (phase === "teaching") {
    return (
      <TeachingPage
        cardIds={missed}
        onDone={() => {
          setPhase("done");
          window.location.hash = "#/";
        }}
      />
    );
  }

  if (phase === "done" || !card || !word) {
    return (
      <div className="mx-auto max-w-md p-6 space-y-4 text-center">
        <h1 className="text-2xl font-bold mt-12">All done!</h1>
        <p className="text-slate-500">
          {done > 0
            ? `You reviewed ${done} card${done === 1 ? "" : "s"}.`
            : "No cards are due right now."}
        </p>
        <a
          href="#/"
          className="inline-block mt-4 px-6 py-3 rounded-xl bg-slate-900 text-white font-medium"
        >
          Back to home
        </a>
      </div>
    );
  }

  const remaining = queue.length;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <a href="#/" className="text-slate-500 text-sm">
          ← Home
        </a>
        <div className="text-sm text-slate-500">
          {done} done · {remaining} left
        </div>
      </header>

      <main className="flex-1 px-4 flex items-center">
        <div className="w-full max-w-md mx-auto">
          <CardView
            card={card}
            word={word}
            flipped={flipped}
            onFlip={() => setFlipped(true)}
          />
        </div>
      </main>

      <footer className="p-4 pb-6 sticky bottom-0 bg-slate-50/90 backdrop-blur">
        {flipped ? (
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            <GradeButton
              label="Wrong"
              hint="1d"
              color="bg-rose-600"
              onClick={() => onGrade("wrong")}
            />
            <GradeButton
              label="Hard"
              hint="x1.2"
              color="bg-amber-600"
              onClick={() => onGrade("hard")}
            />
            <GradeButton
              label="Good"
              hint="xEF"
              color="bg-emerald-600"
              onClick={() => onGrade("good")}
            />
            <GradeButton
              label="Easy"
              hint="xEF·1.3"
              color="bg-sky-600"
              onClick={() => onGrade("easy")}
            />
          </div>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="w-full max-w-md mx-auto block py-4 rounded-xl bg-slate-900 text-white font-medium"
          >
            Show answer
          </button>
        )}
      </footer>
    </div>
  );
}

function GradeButton({
  label,
  hint,
  color,
  onClick,
}: {
  label: string;
  hint: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-xl py-3 flex flex-col items-center active:scale-95 transition`}
    >
      <span className="font-semibold">{label}</span>
      <span className="text-[10px] opacity-80">{hint}</span>
    </button>
  );
}
