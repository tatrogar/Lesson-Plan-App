import { useState } from "react";
import { usePlanStore } from "../state/usePlanStore";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatWeek(iso: string): string {
  if (!iso) return "(no date)";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function PlanList() {
  const plans = usePlanStore((s) => s.plans);
  const createPlan = usePlanStore((s) => s.createPlan);
  const deletePlan = usePlanStore((s) => s.deletePlan);
  const duplicatePlan = usePlanStore((s) => s.duplicatePlan);
  const [newDate, setNewDate] = useState(todayISO());

  const handleCreate = (useSample: boolean) => {
    const id = createPlan(newDate, useSample);
    window.location.hash = `#/plan/${id}`;
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Weekly Lesson Plans
        </h1>
        <p className="mt-1 text-slate-600">
          For SPED teachers — plan your week by session, day, and student.
        </p>
      </header>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Create a new plan</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-slate-700">Week of</span>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="rounded border border-slate-300 px-3 py-2"
            />
          </label>
          <button
            onClick={() => handleCreate(true)}
            className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            New (sample students)
          </button>
          <button
            onClick={() => handleCreate(false)}
            className="rounded border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            New (blank)
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Saved plans</h2>
        {plans.length === 0 ? (
          <p className="text-slate-500">No plans yet. Create one above.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {plans.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="text-sm text-slate-500">Week of</div>
                    <div className="text-lg font-semibold">
                      {formatWeek(p.weekOf)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {p.timeBlocks.length} time blocks • updated{" "}
                  {new Date(p.updatedAt).toLocaleDateString()}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={`#/plan/${p.id}`}
                    className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Open
                  </a>
                  <a
                    href={`#/print/${p.id}`}
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                  >
                    Print
                  </a>
                  <button
                    onClick={() => {
                      const newId = duplicatePlan(p.id);
                      if (newId) window.location.hash = `#/plan/${newId}`;
                    }}
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this plan?")) deletePlan(p.id);
                    }}
                    className="rounded border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
