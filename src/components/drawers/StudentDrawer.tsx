import { useScheduleStore } from "../../state/useScheduleStore";
import { computeStudentMinuteTotals } from "../../domain/warnings";

export default function StudentDrawer() {
  const editingId = useScheduleStore((s) => s.ui.editingStudentId);
  const setEditing = useScheduleStore((s) => s.setEditingStudent);
  const student = useScheduleStore((s) =>
    s.roster.students.find((x) => x.id === editingId) || null
  );
  const updateStudent = useScheduleStore((s) => s.updateStudent);
  const removeStudent = useScheduleStore((s) => s.removeStudent);
  const schedule = useScheduleStore((s) => s.schedule);
  const settings = useScheduleStore((s) => s.roster.settings);
  const slotMin = useScheduleStore((s) => s.appSettings.slotMinutes);

  if (!student) return null;
  const totals = computeStudentMinuteTotals(schedule, student, settings, slotMin);

  const delta = (actual: number, target: number) => actual - target;
  const row = (label: string, actual: number, target: number) => {
    const d = delta(actual, target);
    const color = target === 0 ? "text-slate-600" : d < 0 ? "text-err" : d > 0 ? "text-warn" : "text-ok";
    return (
      <div className="flex justify-between">
        <span>{label}</span>
        <span className={color}>
          {actual} / {target} ({d >= 0 ? "+" : ""}{d})
        </span>
      </div>
    );
  };

  return (
    <div className="no-print fixed inset-y-0 right-0 w-96 bg-white border-l shadow-lg p-4 overflow-y-auto z-20">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Edit student</h2>
        <button className="text-slate-500" onClick={() => setEditing(null)}>✕</button>
      </div>
      <label className="block text-sm">
        Name
        <input
          className="mt-1 w-full border rounded px-2 py-1"
          value={student.name}
          onChange={(e) => updateStudent(student.id, { name: e.target.value })}
        />
      </label>
      <label className="block text-sm mt-2">
        Grade
        <input
          className="mt-1 w-full border rounded px-2 py-1"
          value={student.grade}
          onChange={(e) => updateStudent(student.id, { grade: e.target.value })}
        />
      </label>
      <label className="block text-sm mt-2">
        Support level
        <select
          className="mt-1 w-full border rounded px-2 py-1"
          value={student.supportLevel}
          onChange={(e) => updateStudent(student.id, { supportLevel: e.target.value as any })}
        >
          <option value="1:1">1:1</option>
          <option value="small-group">Small group</option>
          <option value="independent">Independent</option>
        </select>
      </label>
      <label className="block text-sm mt-2">
        Transition threshold (per day)
        <input
          type="number"
          className="mt-1 w-full border rounded px-2 py-1"
          value={student.transitionThreshold}
          onChange={(e) =>
            updateStudent(student.id, { transitionThreshold: parseInt(e.target.value) || 0 })
          }
        />
      </label>

      <h3 className="mt-4 font-semibold text-sm">IEP weekly minute targets</h3>
      {(["genEdMinutesWeek", "spedMinutesWeek", "otMinutesWeek", "speechMinutesWeek"] as const).map(
        (key) => (
          <label key={key} className="block text-sm mt-1">
            {{
              genEdMinutesWeek: "Gen-Ed",
              spedMinutesWeek: "SpEd",
              otMinutesWeek: "OT",
              speechMinutesWeek: "Speech",
            }[key]}
            <input
              type="number"
              className="mt-1 w-full border rounded px-2 py-1"
              value={student.iep[key]}
              onChange={(e) =>
                updateStudent(student.id, {
                  iep: { ...student.iep, [key]: parseInt(e.target.value) || 0 },
                })
              }
            />
          </label>
        )
      )}

      <h3 className="mt-4 font-semibold text-sm">Current weekly totals</h3>
      <div className="text-sm mt-1 space-y-0.5">
        {row("Gen-Ed", totals.genEd, student.iep.genEdMinutesWeek)}
        {row("SpEd", totals.sped, student.iep.spedMinutesWeek)}
        {row("OT", totals.ot, student.iep.otMinutesWeek)}
        {row("Speech", totals.speech, student.iep.speechMinutesWeek)}
      </div>

      <div className="mt-4 flex justify-between">
        <button
          className="text-sm text-err hover:underline"
          onClick={() => {
            if (confirm(`Delete student ${student.name}?`)) {
              removeStudent(student.id);
              setEditing(null);
            }
          }}
        >
          Delete
        </button>
        <a
          href={`#/print/student/${student.id}`}
          className="text-sm px-3 py-1 bg-slate-900 text-white rounded"
        >
          Print day
        </a>
      </div>
    </div>
  );
}
