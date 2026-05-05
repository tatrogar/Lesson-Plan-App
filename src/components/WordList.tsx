import { useMemo, useState } from "react";
import { useDeckStore } from "../state/useDeckStore";

export function WordList() {
  const words = useDeckStore((s) => s.words);
  const cards = useDeckStore((s) => s.cards);
  const introduced = useDeckStore((s) => s.introducedWordIds);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "introduced" | "new">("all");

  const introducedSet = useMemo(() => new Set(introduced), [introduced]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((w) => {
      if (filter === "introduced" && !introducedSet.has(w.id)) return false;
      if (filter === "new" && introducedSet.has(w.id)) return false;
      if (!q) return true;
      return (
        w.english.toLowerCase().includes(q) ||
        w.spanish.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q) ||
        w.pos.toLowerCase().includes(q)
      );
    });
  }, [words, query, filter, introducedSet]);

  return (
    <div className="mx-auto max-w-md p-4 space-y-4 pb-20">
      <header className="flex items-center justify-between">
        <a href="#/" className="text-slate-500 text-sm">
          ← Home
        </a>
        <h1 className="font-semibold">Words</h1>
        <span className="w-12" />
      </header>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search English, Spanish, category…"
        className="w-full px-4 py-2 rounded-xl border border-slate-200"
      />

      <div className="flex gap-2 text-sm">
        {(["all", "introduced", "new"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full ${
              filter === f ? "bg-slate-900 text-white" : "bg-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500">{filtered.length} shown</p>

      <ul className="space-y-2">
        {filtered.map((w) => {
          const c1 = cards[`${w.id}:es-to-en`];
          const c2 = cards[`${w.id}:en-to-es`];
          return (
            <li key={w.id} className="bg-white rounded-xl shadow p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{w.spanish}</div>
                  <div className="text-sm text-slate-600 truncate">
                    {w.english}
                  </div>
                </div>
                <div className="text-xs text-slate-400">#{w.number}</div>
              </div>
              {(w.pos || w.category) && (
                <div className="mt-1 text-xs text-slate-500">
                  {w.pos}
                  {w.pos && w.category ? " · " : ""}
                  {w.category}
                </div>
              )}
              {(c1 || c2) && (
                <div className="mt-2 flex gap-2 text-[11px]">
                  {c1 && <CardBadge label="ES→EN" interval={c1.interval} state={c1.state} />}
                  {c2 && <CardBadge label="EN→ES" interval={c2.interval} state={c2.state} />}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CardBadge({
  label,
  interval,
  state,
}: {
  label: string;
  interval: number;
  state: string;
}) {
  return (
    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
      {label} · {state === "review" ? `${interval}d` : state}
    </span>
  );
}
