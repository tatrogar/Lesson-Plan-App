import { useScheduleStore } from "../../state/useScheduleStore";
import type { Warning } from "../../domain/types";

interface Props {
  warnings: Warning[];
}

export default function WarningsPanel({ warnings }: Props) {
  const setSelectedBlock = useScheduleStore((s) => s.setSelectedBlock);

  const byGroup: Record<string, Warning[]> = { student: [], para: [], provider: [] };
  for (const w of warnings) {
    if (w.kind.startsWith("student")) byGroup.student.push(w);
    else if (w.kind.startsWith("para")) byGroup.para.push(w);
    else byGroup.provider.push(w);
  }

  const severityClass = (s: Warning["severity"]) =>
    s === "error" ? "border-err bg-red-50" : s === "warn" ? "border-warn bg-amber-50" : "border-slate-300 bg-slate-50";

  return (
    <aside className="no-print w-80 border-l bg-white overflow-y-auto p-3 text-sm">
      <h2 className="text-xs font-semibold uppercase text-slate-500 mb-2">Warnings</h2>
      {warnings.length === 0 && <p className="text-xs text-ok">All clear. No warnings.</p>}

      {(["student", "para", "provider"] as const).map((g) =>
        byGroup[g].length === 0 ? null : (
          <section key={g} className="mb-3">
            <h3 className="text-xs font-semibold capitalize text-slate-600 mb-1">{g}</h3>
            <ul className="flex flex-col gap-1">
              {byGroup[g].map((w) => (
                <li
                  key={w.id}
                  className={`border-l-4 px-2 py-1 rounded-sm ${severityClass(w.severity)}`}
                >
                  <div>{w.message}</div>
                  {w.blockIds && w.blockIds.length > 0 && (
                    <button
                      className="text-xs text-indigo-700 hover:underline"
                      onClick={() => setSelectedBlock(w.blockIds![0])}
                    >
                      Jump to block
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )
      )}
    </aside>
  );
}
