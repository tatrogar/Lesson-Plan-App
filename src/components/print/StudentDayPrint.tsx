import { useScheduleStore } from "../../state/useScheduleStore";
import { DAYS } from "../../domain/constants";
import { blockDurationMin, formatTime12, slotToMinutes } from "../../domain/timeUtils";

export default function StudentDayPrint({ studentId }: { studentId: string }) {
  const student = useScheduleStore((s) => s.roster.students.find((x) => x.id === studentId));
  const schedule = useScheduleStore((s) => s.schedule);
  const settings = useScheduleStore((s) => s.roster.settings);
  const appSettings = useScheduleStore((s) => s.appSettings);
  const paras = useScheduleStore((s) => s.roster.paras);

  if (!student) return <p className="p-4">Student not found. <a className="text-indigo-700" href="#/">Back</a></p>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="no-print mb-3 flex justify-between">
        <a href="#/" className="text-indigo-700 text-sm">← Back to schedule</a>
        <button className="px-3 py-1 bg-slate-900 text-white rounded text-sm" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <h1 className="text-2xl font-semibold">{student.name} — weekly schedule</h1>
      <p className="text-sm text-slate-600">
        Grade {student.grade} · {student.supportLevel} · IEP: Gen-Ed {student.iep.genEdMinutesWeek} min,
        SpEd {student.iep.spedMinutesWeek} min, OT {student.iep.otMinutesWeek} min, Speech{" "}
        {student.iep.speechMinutesWeek} min
      </p>
      {DAYS.map((day) => {
        const mine = Object.values(schedule.blocks)
          .filter((b) => b.day === day && b.studentIds.includes(student.id))
          .sort((a, b) => a.startSlot - b.startSlot);
        if (mine.length === 0) return null;
        return (
          <section key={day} className="mt-4 break-inside-avoid">
            <h2 className="font-semibold border-b mb-1">{day}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="w-40">Time</th>
                  <th>Setting</th>
                  <th>Paras</th>
                  <th className="w-20 text-right">Min</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((b) => {
                  const setting = settings.find((s) => s.id === b.settingId);
                  const startMin = slotToMinutes(b.startSlot, appSettings.dayStart, appSettings.slotMinutes);
                  const endMin = slotToMinutes(b.endSlot, appSettings.dayStart, appSettings.slotMinutes);
                  const dur = blockDurationMin(b.startSlot, b.endSlot, appSettings.slotMinutes);
                  const paraNames = b.paraIds
                    .map((id) => paras.find((p) => p.id === id)?.name)
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <tr key={b.id} className={`border-b setting-${setting?.kind}`}>
                      <td>{formatTime12(startMin)} – {formatTime12(endMin)}</td>
                      <td>{setting?.name}{b.label ? ` — ${b.label}` : ""}{b.providerId ? ` (${b.providerId})` : ""}</td>
                      <td>{paraNames}</td>
                      <td className="text-right">{dur}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
