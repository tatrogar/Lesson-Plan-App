import { SESSION_TYPES } from "../types";
import { sessionSwatch } from "../lib/colors";

export function SessionKey() {
  return (
    <div className="mt-4 rounded border border-slate-300 bg-white p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        Session Key
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        {SESSION_TYPES.map((t) => (
          <div key={t.value} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-4 w-6 rounded ${sessionSwatch[t.value]}`}
            />
            <span>{t.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-6 rounded bg-orange-300" />
          <span>Pull-out service</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-4 w-6 rounded bg-slate-300" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
