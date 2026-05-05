import { useRef, useState } from "react";
import { useDeckStore } from "../state/useDeckStore";
import { parseCsv } from "../lib/csv";

export function Settings() {
  const importWords = useDeckStore((s) => s.importWords);
  const exportJson = useDeckStore((s) => s.exportJson);
  const importJson = useDeckStore((s) => s.importJson);
  const resetAll = useDeckStore((s) => s.resetAll);
  const wordCount = useDeckStore((s) => s.words.length);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onCsvFile = async (file: File) => {
    const text = await file.text();
    const { words, errors } = parseCsv(text);
    if (words.length === 0) {
      setMessage(`No words parsed. ${errors.slice(0, 3).join("; ")}`);
      return;
    }
    const { added, updated } = importWords(words);
    setMessage(
      `Imported: ${added} new, ${updated} updated.${
        errors.length > 0 ? ` ${errors.length} row warnings.` : ""
      }`,
    );
  };

  const onJsonFile = async (file: File) => {
    const text = await file.text();
    const ok = importJson(text);
    setMessage(ok ? "Backup restored." : "Invalid backup file.");
  };

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leitner-spanish-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onReset = () => {
    if (
      confirm(
        "Reset everything? This deletes all words, cards, and progress. Cannot be undone.",
      )
    ) {
      resetAll();
      setMessage("Reset complete.");
    }
  };

  return (
    <div className="mx-auto max-w-md p-4 space-y-4">
      <header className="flex items-center justify-between">
        <a href="#/" className="text-slate-500 text-sm">
          ← Home
        </a>
        <h1 className="font-semibold">Settings</h1>
        <span className="w-12" />
      </header>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-sm">
          {message}
        </div>
      )}

      <section className="bg-white rounded-2xl shadow p-4 space-y-3">
        <h2 className="font-semibold">Import word list (CSV)</h2>
        <p className="text-sm text-slate-500">
          Headers: <code>number, english, spanish, pos, category, example</code>.
          Re-importing keeps your card progress.
        </p>
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onCsvFile(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => csvInputRef.current?.click()}
          className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium"
        >
          Choose CSV file
        </button>
        <p className="text-xs text-slate-500 text-center">
          {wordCount} words currently loaded
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow p-4 space-y-3">
        <h2 className="font-semibold">Backup</h2>
        <p className="text-sm text-slate-500">
          Export saves words + card progress to a JSON file. Import replaces all
          data with the file's contents.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExport}
            className="py-2 rounded-xl bg-slate-100 font-medium"
          >
            Export
          </button>
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="py-2 rounded-xl bg-slate-100 font-medium"
          >
            Import
          </button>
        </div>
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onJsonFile(f);
            e.target.value = "";
          }}
        />
      </section>

      <section className="bg-white rounded-2xl shadow p-4 space-y-3">
        <h2 className="font-semibold text-rose-700">Danger zone</h2>
        <button
          onClick={onReset}
          className="w-full py-2 rounded-xl bg-rose-600 text-white font-medium"
        >
          Reset everything
        </button>
      </section>
    </div>
  );
}
