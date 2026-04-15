import { useScheduleStore } from "../../state/useScheduleStore";
import { fromMinutes, toMinutes } from "../../domain/timeUtils";
import { useState } from "react";

export default function RosterEditor() {
  const students = useScheduleStore((s) => s.roster.students);
  const paras = useScheduleStore((s) => s.roster.paras);
  const settings = useScheduleStore((s) => s.roster.settings);
  const providers = useScheduleStore((s) => s.roster.providers);
  const addStudent = useScheduleStore((s) => s.addStudent);
  const addPara = useScheduleStore((s) => s.addPara);
  const addSetting = useScheduleStore((s) => s.addSetting);
  const removeSetting = useScheduleStore((s) => s.removeSetting);
  const addProvider = useScheduleStore((s) => s.addProvider);
  const removeProvider = useScheduleStore((s) => s.removeProvider);
  const updateAppSettings = useScheduleStore((s) => s.updateAppSettings);
  const appSettings = useScheduleStore((s) => s.appSettings);
  const setEditingStudent = useScheduleStore((s) => s.setEditingStudent);
  const setEditingPara = useScheduleStore((s) => s.setEditingPara);

  const [newSettingName, setNewSettingName] = useState("");
  const [newSettingKind, setNewSettingKind] = useState<"gen-ed" | "sped" | "ot" | "speech" | "lunch" | "specials">("gen-ed");
  const [newProvider, setNewProvider] = useState("");

  return (
    <div className="flex-1 overflow-auto p-4 grid gap-6 md:grid-cols-2">
      <section className="border rounded bg-white p-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Students ({students.length})</h2>
          <button
            className="px-2 py-1 bg-indigo-600 text-white rounded text-sm"
            onClick={() => {
              addStudent({
                name: "New student",
                grade: "",
                iep: {
                  genEdMinutesWeek: 0,
                  spedMinutesWeek: 0,
                  otMinutesWeek: 0,
                  speechMinutesWeek: 0,
                },
                supportLevel: "small-group",
                transitionThreshold: 4,
              });
            }}
          >
            + Add student
          </button>
        </div>
        <ul className="text-sm divide-y">
          {students.map((s) => (
            <li key={s.id} className="py-1 flex justify-between items-center">
              <span>
                <span className="font-medium">{s.name}</span>{" "}
                <span className="text-xs text-slate-500">
                  (gr {s.grade}, {s.supportLevel})
                </span>
              </span>
              <button
                className="text-xs text-indigo-700 hover:underline"
                onClick={() => setEditingStudent(s.id)}
              >
                edit
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="border rounded bg-white p-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Paras ({paras.length})</h2>
          <button
            className="px-2 py-1 bg-amber-600 text-white rounded text-sm"
            onClick={() => {
              addPara({
                name: "New para",
                shiftStart: 8 * 60,
                shiftEnd: 15 * 60 + 30,
                lunch: { lengthMin: 30, windowStart: 11 * 60, windowEnd: 13 * 60 },
                maxConsecutiveMin: 180,
                maxDailyMin: 390,
                transitionThreshold: 5,
              });
            }}
          >
            + Add para
          </button>
        </div>
        <ul className="text-sm divide-y">
          {paras.map((p) => (
            <li key={p.id} className="py-1 flex justify-between items-center">
              <span className="font-medium">{p.name}</span>
              <button
                className="text-xs text-amber-800 hover:underline"
                onClick={() => setEditingPara(p.id)}
              >
                edit
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="border rounded bg-white p-3">
        <h2 className="font-semibold mb-2">Settings / rooms ({settings.length})</h2>
        <ul className="text-sm divide-y mb-2">
          {settings.map((s) => (
            <li key={s.id} className="py-1 flex justify-between items-center">
              <span>
                {s.name}{" "}
                <span className={`text-xs px-1 rounded setting-${s.kind}`}>{s.kind}</span>
              </span>
              <button
                className="text-xs text-err hover:underline"
                onClick={() => removeSetting(s.id)}
              >
                remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 items-end">
          <label className="text-sm flex-1">
            Name
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={newSettingName}
              onChange={(e) => setNewSettingName(e.target.value)}
            />
          </label>
          <label className="text-sm">
            Kind
            <select
              className="mt-1 block border rounded px-2 py-1"
              value={newSettingKind}
              onChange={(e) => setNewSettingKind(e.target.value as any)}
            >
              <option value="gen-ed">gen-ed</option>
              <option value="sped">sped</option>
              <option value="ot">ot</option>
              <option value="speech">speech</option>
              <option value="lunch">lunch</option>
              <option value="specials">specials</option>
            </select>
          </label>
          <button
            className="px-2 py-1 bg-slate-900 text-white rounded text-sm"
            onClick={() => {
              if (!newSettingName) return;
              addSetting({ name: newSettingName, kind: newSettingKind });
              setNewSettingName("");
            }}
          >
            Add
          </button>
        </div>
      </section>

      <section className="border rounded bg-white p-3">
        <h2 className="font-semibold mb-2">Providers (OT / Speech)</h2>
        <ul className="text-sm divide-y mb-2">
          {providers.map((p) => (
            <li key={p} className="py-1 flex justify-between items-center">
              <span>{p}</span>
              <button
                className="text-xs text-err hover:underline"
                onClick={() => removeProvider(p)}
              >
                remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-2 py-1 text-sm"
            placeholder="e.g., OT: Ms. Chen"
            value={newProvider}
            onChange={(e) => setNewProvider(e.target.value)}
          />
          <button
            className="px-2 py-1 bg-slate-900 text-white rounded text-sm"
            onClick={() => {
              if (!newProvider) return;
              addProvider(newProvider);
              setNewProvider("");
            }}
          >
            Add
          </button>
        </div>
      </section>

      <section className="border rounded bg-white p-3 md:col-span-2">
        <h2 className="font-semibold mb-2">School day</h2>
        <div className="flex gap-4 flex-wrap items-end">
          <label className="text-sm">
            Start
            <input
              type="time"
              className="block mt-1 border rounded px-2 py-1"
              value={fromMinutes(appSettings.dayStart)}
              onChange={(e) => updateAppSettings({ dayStart: toMinutes(e.target.value) })}
            />
          </label>
          <label className="text-sm">
            End
            <input
              type="time"
              className="block mt-1 border rounded px-2 py-1"
              value={fromMinutes(appSettings.dayEnd)}
              onChange={(e) => updateAppSettings({ dayEnd: toMinutes(e.target.value) })}
            />
          </label>
          <label className="text-sm">
            Slot (minutes)
            <input
              type="number"
              className="block mt-1 border rounded px-2 py-1 w-20"
              value={appSettings.slotMinutes}
              onChange={(e) =>
                updateAppSettings({ slotMinutes: Math.max(5, parseInt(e.target.value) || 15) })
              }
            />
          </label>
        </div>
      </section>
    </div>
  );
}
