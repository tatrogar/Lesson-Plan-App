import { useEffect } from "react";
import { usePlanStore } from "../state/usePlanStore";
import { DAYS } from "../types";
import { cellStyleClass, sessionColor, sessionSwatch } from "../lib/colors";
import { SESSION_TYPES } from "../types";

interface Props {
  planId: string;
}

export function PrintView({ planId }: Props) {
  const plan = usePlanStore((s) => s.plans.find((p) => p.id === planId));

  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [planId]);

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <p>Plan not found.</p>
        <a href="#/" className="text-indigo-600 underline">
          Back
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 print:p-0">
      <div className="mb-3 flex items-center justify-between no-print">
        <a
          href={`#/plan/${plan.id}`}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
        >
          ← Back to edit
        </a>
        <button
          onClick={() => window.print()}
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Print
        </button>
      </div>

      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="bg-slate-900 text-white">
            <th className="border border-slate-700 p-1.5 text-left" colSpan={3}>
              <div className="text-[8px] uppercase tracking-wide text-slate-300">
                Week of
              </div>
              <div className="text-sm">
                {plan.weekOf
                  ? new Date(plan.weekOf).toLocaleDateString()
                  : "—"}
              </div>
            </th>
            <th
              className="border border-slate-700 p-1.5 text-center text-sm font-bold"
              colSpan={DAYS.length + 2}
            >
              WEEKLY LESSON PLAN
            </th>
          </tr>
          <tr className="bg-slate-800 text-white">
            <th className="border border-slate-700 p-1">Time</th>
            <th className="border border-slate-700 p-1">Session / Prep</th>
            <th className="border border-slate-700 p-1">Status</th>
            {DAYS.map((d) => (
              <th key={d.key} className="border border-slate-700 p-1">
                {d.label}
              </th>
            ))}
            <th className="border border-slate-700 p-1">Materials</th>
            <th className="border border-slate-700 p-1">Notes</th>
          </tr>
        </thead>
        <tbody>
          {plan.timeBlocks.map((block) =>
            block.rows.map((row, idx) => (
              <tr key={row.id} className="border border-slate-300">
                {idx === 0 && (
                  <td
                    rowSpan={block.rows.length}
                    className="border border-slate-300 bg-slate-50 p-1 text-center align-middle text-[10px]"
                  >
                    {block.time}
                  </td>
                )}
                <td
                  className={`border border-slate-300 p-1 text-[10px] font-medium ${sessionColor[row.type]}`}
                >
                  {row.name}
                </td>
                <td className="border border-slate-300 p-1 text-center">
                  {row.status}
                </td>
                {DAYS.map((d) => {
                  const cell = row.days[d.key];
                  return (
                    <td
                      key={d.key}
                      className={`border border-slate-300 p-1 text-center ${cellStyleClass[cell.style]}`}
                    >
                      {cell.text}
                    </td>
                  );
                })}
                <td className="border border-slate-300 p-1">
                  {row.materials}
                </td>
                <td className="border border-slate-300 p-1">{row.notes}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>

      <div className="mt-3 rounded border border-slate-300 p-2 text-[10px]">
        <div className="mb-1 font-semibold uppercase tracking-wide text-slate-600">
          Session Key
        </div>
        <div className="flex flex-wrap gap-3">
          {SESSION_TYPES.map((t) => (
            <div key={t.value} className="flex items-center gap-1.5">
              <span
                className={`inline-block h-3 w-5 rounded ${sessionSwatch[t.value]}`}
              />
              <span>{t.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-5 rounded bg-orange-300" />
            <span>Pull-out</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-5 rounded bg-slate-300" />
            <span>Unavailable</span>
          </div>
        </div>
      </div>
    </div>
  );
}
