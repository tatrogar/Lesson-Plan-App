import { useDeckStore } from "../state/useDeckStore";
import { todayIso } from "../lib/date";

export function Home() {
  const words = useDeckStore((s) => s.words);
  const cards = useDeckStore((s) => s.cards);
  const introduced = useDeckStore((s) => s.introducedWordIds);
  const reviewedToday = useDeckStore((s) => s.reviewedToday);
  const lastReviewDate = useDeckStore((s) => s.lastReviewDate);
  const addNewBatch = useDeckStore((s) => s.addNewBatch);
  const dueCardIds = useDeckStore((s) => s.dueCardIds);

  const today = todayIso();
  const dueCount = dueCardIds(today).length;
  const totalCards = Object.keys(cards).length;
  const remainingPool = words.length - introduced.length;
  const sessionToday = lastReviewDate === today ? reviewedToday : 0;

  const startReview = () => {
    if (dueCount > 0) window.location.hash = "#/review";
  };

  const onAdd = (n: number) => {
    const added = addNewBatch(n);
    if (added === 0) {
      alert(
        words.length === 0
          ? "Import your CSV first (Settings)."
          : "No more new words — you've introduced them all!",
      );
    }
  };

  return (
    <div className="mx-auto max-w-md p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Spanish Leitner</h1>
        <p className="text-slate-500 text-sm mt-1">
          {words.length === 0
            ? "Start by importing your word list."
            : `${introduced.length} of ${words.length} words introduced`}
        </p>
      </header>

      <section className="bg-white rounded-2xl shadow p-6 text-center">
        <div className="text-6xl font-bold text-slate-900">{dueCount}</div>
        <div className="text-slate-500 mt-1">
          {dueCount === 1 ? "card due" : "cards due"} today
        </div>
        <button
          onClick={startReview}
          disabled={dueCount === 0}
          className="mt-4 w-full py-3 rounded-xl bg-slate-900 text-white font-medium disabled:bg-slate-300"
        >
          {dueCount === 0 ? "Nothing due" : "Start review"}
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 space-y-3">
        <h2 className="font-semibold">Add new words</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onAdd(5)}
            disabled={remainingPool === 0}
            className="py-3 rounded-xl bg-emerald-600 text-white font-medium disabled:bg-slate-300"
          >
            + 5 new
          </button>
          <button
            onClick={() => onAdd(10)}
            disabled={remainingPool === 0}
            className="py-3 rounded-xl bg-emerald-700 text-white font-medium disabled:bg-slate-300"
          >
            + 10 new
          </button>
        </div>
        <p className="text-xs text-slate-500 text-center">
          {remainingPool} words left to introduce
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Cards" value={totalCards} />
        <Stat label="Reviewed today" value={sessionToday} />
        <Stat label="Words" value={words.length} />
      </section>

      <nav className="grid grid-cols-2 gap-3">
        <a
          href="#/words"
          className="text-center py-3 rounded-xl bg-white shadow font-medium"
        >
          Browse words
        </a>
        <a
          href="#/settings"
          className="text-center py-3 rounded-xl bg-white shadow font-medium"
        >
          Settings
        </a>
      </nav>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow p-3">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
