import { useScheduleStore } from "../state/useScheduleStore";
import { DAYS } from "../domain/constants";
import type { Warning } from "../domain/types";

interface Props {
  route: "schedule" | "roster" | "print-student" | "print-para";
  warnings: Warning[];
}

export default function TopBar({ route, warnings }: Props) {
  const selectedDay = useScheduleStore((s) => s.ui.selectedDay);
  const setSelectedDay = useScheduleStore((s) => s.setSelectedDay);
  const loadSample = useScheduleStore((s) => s.loadSample);
  const resetAll = useScheduleStore((s) => s.resetAll);
  const students = useScheduleStore((s) => s.roster.students);
  const paras = useScheduleStore((s) => s.roster.paras);

  const errors = warnings.filter((w) => w.severity === "error").length;
  const warns = warnings.filter((w) => w.severity === "warn").length;

  return (
    <header className="no-print flex items-center gap-4 px-4 py-2 border-b bg-white">
      <h1 className="text-lg font-semibold">SpEd Scheduler</h1>
      <nav className="flex gap-2">
        <a
          href="#/"
          className={`px-2 py-1 rounded text-sm ${route === "schedule" ? "bg-slate-900 text-white" : "bg-slate-100"}`}
        >
          Schedule
        </a>
        <a
          href="#/roster"
          className={`px-2 py-1 rounded text-sm ${route === "roster" ? "bg-slate-900 text-white" : "bg-slate-100"}`}
        >
          Roster
        </a>
      </nav>
      {route === "schedule" && (
        <div className="flex gap-1">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-2 py-1 text-sm rounded ${selectedDay === d ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
            >
              {d}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1" />
      <div className="text-sm">
        <span className="inline-block px-2 py-0.5 rounded bg-err text-white mr-1">{errors} err</span>
        <span className="inline-block px-2 py-0.5 rounded bg-warn text-white">{warns} warn</span>
      </div>
      <div className="flex gap-2 text-sm">
        <div className="relative group">
          <button className="px-2 py-1 bg-slate-100 rounded">Print ▾</button>
          <div className="absolute right-0 top-full hidden group-hover:block bg-white border rounded shadow z-10 w-56 max-h-96 overflow-auto">
            <div className="px-2 py-1 text-xs text-slate-500">Students</div>
            {students.map((s) => (
              <a key={s.id} href={`#/print/student/${s.id}`} className="block px-2 py-1 hover:bg-slate-100">
                {s.name}
              </a>
            ))}
            <div className="px-2 py-1 text-xs text-slate-500 border-t">Paras</div>
            {paras.map((p) => (
              <a key={p.id} href={`#/print/para/${p.id}`} className="block px-2 py-1 hover:bg-slate-100">
                {p.name}
              </a>
            ))}
          </div>
        </div>
        <button className="px-2 py-1 bg-slate-100 rounded" onClick={loadSample}>
          Load sample roster
        </button>
        <button
          className="px-2 py-1 bg-slate-100 rounded"
          onClick={() => {
            if (confirm("Reset all data? This clears roster and schedule.")) resetAll();
          }}
        >
          Reset
        </button>
      </div>
    </header>
  );
}
