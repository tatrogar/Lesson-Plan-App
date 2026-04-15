import { useScheduleStore } from "../../state/useScheduleStore";
import { fromMinutes, toMinutes } from "../../domain/timeUtils";
import { computeParaDayTotals } from "../../domain/warnings";

export default function ParaDrawer() {
  const editingId = useScheduleStore((s) => s.ui.editingParaId);
  const setEditing = useScheduleStore((s) => s.setEditingPara);
  const para = useScheduleStore((s) => s.roster.paras.find((x) => x.id === editingId) || null);
  const updatePara = useScheduleStore((s) => s.updatePara);
  const removePara = useScheduleStore((s) => s.removePara);
  const schedule = useScheduleStore((s) => s.schedule);
  const settings = useScheduleStore((s) => s.roster.settings);
  const slotMin = useScheduleStore((s) => s.appSettings.slotMinutes);
  const activeDays = useScheduleStore((s) => s.appSettings.activeDays);

  if (!para) return null;

  const timeInput = (label: string, value: number, onChange: (n: number) => void) => (
    <label className="block text-sm mt-2">
      {label}
      <input
        type="time"
        className="mt-1 w-full border rounded px-2 py-1"
        value={fromMinutes(value)}
        onChange={(e) => onChange(toMinutes(e.target.value))}
      />
    </label>
  );

  return (
    <div className="no-print fixed inset-y-0 right-0 w-96 bg-white border-l shadow-lg p-4 overflow-y-auto z-20">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Edit para</h2>
        <button className="text-slate-500" onClick={() => setEditing(null)}>✕</button>
      </div>
      <label className="block text-sm">
        Name
        <input
          className="mt-1 w-full border rounded px-2 py-1"
          value={para.name}
          onChange={(e) => updatePara(para.id, { name: e.target.value })}
        />
      </label>
      {timeInput("Shift start", para.shiftStart, (n) => updatePara(para.id, { shiftStart: n }))}
      {timeInput("Shift end", para.shiftEnd, (n) => updatePara(para.id, { shiftEnd: n }))}

      <h3 className="mt-3 text-sm font-semibold">Lunch</h3>
      <label className="block text-sm mt-1">
        Required length (min)
        <input
          type="number"
          className="mt-1 w-full border rounded px-2 py-1"
          value={para.lunch.lengthMin}
          onChange={(e) =>
            updatePara(para.id, {
              lunch: { ...para.lunch, lengthMin: parseInt(e.target.value) || 0 },
            })
          }
        />
      </label>
      {timeInput("Window start", para.lunch.windowStart, (n) =>
        updatePara(para.id, { lunch: { ...para.lunch, windowStart: n } })
      )}
      {timeInput("Window end", para.lunch.windowEnd, (n) =>
        updatePara(para.id, { lunch: { ...para.lunch, windowEnd: n } })
      )}

      <label className="block text-sm mt-2">
        Max consecutive minutes (no break)
        <input
          type="number"
          className="mt-1 w-full border rounded px-2 py-1"
          value={para.maxConsecutiveMin}
          onChange={(e) => updatePara(para.id, { maxConsecutiveMin: parseInt(e.target.value) || 0 })}
        />
      </label>
      <label className="block text-sm mt-2">
        Max daily working minutes
        <input
          type="number"
          className="mt-1 w-full border rounded px-2 py-1"
          value={para.maxDailyMin}
          onChange={(e) => updatePara(para.id, { maxDailyMin: parseInt(e.target.value) || 0 })}
        />
      </label>
      <label className="block text-sm mt-2">
        Transition threshold (per day)
        <input
          type="number"
          className="mt-1 w-full border rounded px-2 py-1"
          value={para.transitionThreshold}
          onChange={(e) => updatePara(para.id, { transitionThreshold: parseInt(e.target.value) || 0 })}
        />
      </label>

      <h3 className="mt-4 font-semibold text-sm">Per-day totals</h3>
      <table className="text-xs w-full mt-1">
        <thead>
          <tr className="text-slate-500">
            <th className="text-left">Day</th>
            <th>Worked</th>
            <th>Lunch</th>
            <th>Trans.</th>
          </tr>
        </thead>
        <tbody>
          {activeDays.map((d) => {
            const t = computeParaDayTotals(schedule, para, d, settings, slotMin);
            return (
              <tr key={d}>
                <td>{d}</td>
                <td className="text-center">{t.workedMin}</td>
                <td className="text-center">{t.lunchMin}</td>
                <td className="text-center">{t.transitions}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between">
        <button
          className="text-sm text-err hover:underline"
          onClick={() => {
            if (confirm(`Delete para ${para.name}?`)) {
              removePara(para.id);
              setEditing(null);
            }
          }}
        >
          Delete
        </button>
        <a
          href={`#/print/para/${para.id}`}
          className="text-sm px-3 py-1 bg-slate-900 text-white rounded"
        >
          Print day
        </a>
      </div>
    </div>
  );
}
