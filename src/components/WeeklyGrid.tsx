import { useState } from "react";
import { usePlanStore } from "../state/usePlanStore";
import { DAYS } from "../types";
import { TimeBlockRow } from "./TimeBlockRow";
import { SessionKey } from "./SessionKey";

interface Props {
  planId: string;
}

export function WeeklyGrid({ planId }: Props) {
  const plan = usePlanStore((s) => s.plans.find((p) => p.id === planId));
  const addTimeBlock = usePlanStore((s) => s.addTimeBlock);
  const updateWeekOf = usePlanStore((s) => s.updateWeekOf);
  const [newTime, setNewTime] = useState("");

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Plan not found.</p>
        <a href="#/" className="mt-2 inline-block text-indigo-600 underline">
          Back to list
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <a
            href="#/"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
          >
            ← All plans
          </a>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-700">Week of:</span>
            <input
              type="date"
              value={plan.weekOf}
              onChange={(e) => updateWeekOf(plan.id, e.target.value)}
              className="rounded border border-slate-300 px-2 py-1"
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`#/print/${plan.id}`}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Print / Export
          </a>
        </div>
      </header>

      <div className="overflow-auto rounded border border-slate-300 bg-white">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="border-r border-slate-700 p-2 text-left" colSpan={3}>
                <div className="text-[10px] uppercase tracking-wide text-slate-300">
                  Week of
                </div>
                <div className="text-base">
                  {plan.weekOf
                    ? new Date(plan.weekOf).toLocaleDateString()
                    : "—"}
                </div>
              </th>
              <th
                className="border-l border-slate-700 p-2 text-center text-base font-bold"
                colSpan={DAYS.length + 2}
              >
                WEEKLY LESSON PLAN
              </th>
            </tr>
            <tr className="bg-slate-800 text-white">
              <th className="w-20 border border-slate-700 p-1.5">Time</th>
              <th className="w-40 border border-slate-700 p-1.5">
                Session / Prep
              </th>
              <th className="w-16 border border-slate-700 p-1.5">Status</th>
              {DAYS.map((d) => (
                <th key={d.key} className="border border-slate-700 p-1.5">
                  {d.label}
                </th>
              ))}
              <th className="w-28 border border-slate-700 p-1.5">Materials</th>
              <th className="w-28 border border-slate-700 p-1.5">Notes</th>
            </tr>
          </thead>
          <tbody>
            {plan.timeBlocks.map((block) => (
              <TimeBlockRow key={block.id} planId={plan.id} block={block} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-2 no-print">
        <label className="flex flex-col text-sm">
          <span className="text-slate-700">Add a time block</span>
          <input
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            placeholder="e.g. 3:30–4:00"
            className="rounded border border-slate-300 px-3 py-1.5"
          />
        </label>
        <button
          onClick={() => {
            if (!newTime.trim()) return;
            addTimeBlock(plan.id, newTime.trim());
            setNewTime("");
          }}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900"
        >
          + Add block
        </button>
      </div>

      <SessionKey />

      <p className="mt-4 text-xs text-slate-500 no-print">
        Tip: hover over a day cell and click the small dot in the corner to
        cycle Normal → Pull-out (orange) → Unavailable (gray).
      </p>
    </div>
  );
}
