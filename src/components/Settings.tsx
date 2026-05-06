import { useRef, useState } from "react";
import { useDeckStore } from "../state/useDeckStore";
import { parseCsv } from "../lib/csv";
import { gistUrl } from "../lib/gist";

function formatTime(iso: string | null): string {
  if (!iso) return "never";
  const d = new Date(iso);
  return d.toLocaleString();
}

export function Settings() {
  const importWords = useDeckStore((s) => s.importWords);
  const exportJson = useDeckStore((s) => s.exportJson);
  const importJson = useDeckStore((s) => s.importJson);
  const resetAll = useDeckStore((s) => s.resetAll);
  const wordCount = useDeckStore((s) => s.words.length);

  const syncToken = useDeckStore((s) => s.syncToken);
  const syncGistId = useDeckStore((s) => s.syncGistId);
  const syncLogin = useDeckStore((s) => s.syncLogin);
  const lastPushedAt = useDeckStore((s) => s.lastPushedAt);
  const lastPulledAt = useDeckStore((s) => s.lastPulledAt);
  const connectSync = useDeckStore((s) => s.connectSync);
  const disconnectSync = useDeckStore((s) => s.disconnectSync);
  const pushToCloud = useDeckStore((s) => s.pushToCloud);
  const pullFromCloud = useDeckStore((s) => s.pullFromCloud);

  const [tokenInput, setTokenInput] = useState("");
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

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

  const runSync = async (fn: () => Promise<void>, label: string) => {
    setSyncBusy(true);
    setSyncError(null);
    try {
      await fn();
      setMessage(`${label} complete.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSyncError(msg);
    } finally {
      setSyncBusy(false);
    }
  };

  const onConnect = () => {
    const t = tokenInput.trim();
    if (!t) {
      setSyncError("Paste a token first.");
      return;
    }
    runSync(async () => {
      await connectSync(t);
      setTokenInput("");
    }, "Connected");
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
        <h2 className="font-semibold">Sync between devices</h2>
        <p className="text-sm text-slate-500">
          Stores your progress in a private GitHub Gist. Use the same token on
          your phone and computer to share data.
        </p>

        {syncError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-sm">
            {syncError}
          </div>
        )}

        {syncToken && syncGistId ? (
          <>
            <div className="text-sm space-y-1">
              <div>
                Connected as{" "}
                <span className="font-mono">{syncLogin ?? "?"}</span>
              </div>
              <div className="text-slate-500 text-xs">
                Gist:{" "}
                <a
                  href={gistUrl(syncGistId, syncLogin ?? undefined)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline break-all"
                >
                  {syncGistId}
                </a>
              </div>
              <div className="text-slate-500 text-xs">
                Last push: {formatTime(lastPushedAt)}
              </div>
              <div className="text-slate-500 text-xs">
                Last pull: {formatTime(lastPulledAt)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => runSync(pushToCloud, "Push")}
                disabled={syncBusy}
                className="py-2 rounded-xl bg-slate-900 text-white font-medium disabled:bg-slate-300"
              >
                {syncBusy ? "…" : "Push to cloud"}
              </button>
              <button
                onClick={() => runSync(pullFromCloud, "Pull")}
                disabled={syncBusy}
                className="py-2 rounded-xl bg-emerald-700 text-white font-medium disabled:bg-slate-300"
              >
                {syncBusy ? "…" : "Pull from cloud"}
              </button>
            </div>
            <button
              onClick={() => {
                if (confirm("Forget token on this device?")) disconnectSync();
              }}
              className="w-full py-2 rounded-xl bg-slate-100 text-sm"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <ol className="text-xs text-slate-500 space-y-1 list-decimal pl-4">
              <li>
                Open{" "}
                <a
                  href="https://github.com/settings/tokens/new?scopes=gist&description=Spanish%20Lesson%20sync"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  github.com/settings/tokens/new
                </a>
              </li>
              <li>
                Confirm only <strong>gist</strong> is checked, set expiration,
                click Generate
              </li>
              <li>Copy the token and paste below</li>
            </ol>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_… or github_pat_…"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 font-mono text-sm"
            />
            <button
              onClick={onConnect}
              disabled={syncBusy}
              className="w-full py-3 rounded-xl bg-slate-900 text-white font-medium disabled:bg-slate-300"
            >
              {syncBusy ? "Connecting…" : "Connect"}
            </button>
            <p className="text-xs text-slate-500">
              The token is stored in this browser only. It's never sent
              anywhere except api.github.com.
            </p>
          </>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow p-4 space-y-3">
        <h2 className="font-semibold">Backup (file)</h2>
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
          className="w-full py-2 rounded-xl bg-slate-100 text-rose-700 font-medium"
        >
          Reset everything
        </button>
      </section>
    </div>
  );
}
