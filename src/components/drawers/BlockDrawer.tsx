import { useScheduleStore } from "../../state/useScheduleStore";
import { slotToMinutes, formatTime12 } from "../../domain/timeUtils";

export default function BlockDrawer() {
  const selectedBlockId = useScheduleStore((s) => s.ui.selectedBlockId);
  const setSelectedBlock = useScheduleStore((s) => s.setSelectedBlock);
  const block = useScheduleStore((s) =>
    selectedBlockId ? s.schedule.blocks[selectedBlockId] || null : null
  );
  const settings = useScheduleStore((s) => s.roster.settings);
  const students = useScheduleStore((s) => s.roster.students);
  const paras = useScheduleStore((s) => s.roster.paras);
  const providers = useScheduleStore((s) => s.roster.providers);
  const appSettings = useScheduleStore((s) => s.appSettings);
  const updateBlock = useScheduleStore((s) => s.updateBlock);
  const deleteBlock = useScheduleStore((s) => s.deleteBlock);
  const unassignStudent = useScheduleStore((s) => s.unassignStudent);
  const unassignPara = useScheduleStore((s) => s.unassignPara);
  const assignStudent = useScheduleStore((s) => s.assignStudent);
  const assignPara = useScheduleStore((s) => s.assignPara);

  if (!block) return null;
  const setting = settings.find((s) => s.id === block.settingId);

  const startMin = slotToMinutes(block.startSlot, appSettings.dayStart, appSettings.slotMinutes);
  const endMin = slotToMinutes(block.endSlot, appSettings.dayStart, appSettings.slotMinutes);
  const unassignedStudents = students.filter((s) => !block.studentIds.includes(s.id));
  const unassignedParas = paras.filter((p) => !block.paraIds.includes(p.id));

  const isPullOut = setting?.kind === "ot" || setting?.kind === "speech";

  return (
    <div className="no-print fixed inset-y-0 right-0 w-96 bg-white border-l shadow-lg p-4 overflow-y-auto z-10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Block</h2>
        <button className="text-slate-500" onClick={() => setSelectedBlock(null)}>
          ✕
        </button>
      </div>
      <p className="text-sm text-slate-600">
        {block.day} · {formatTime12(startMin)} – {formatTime12(endMin)}
      </p>
      <label className="block text-sm mt-3">
        Setting
        <select
          className="mt-1 w-full border rounded px-2 py-1"
          value={block.settingId}
          onChange={(e) => updateBlock(block.id, { settingId: e.target.value })}
        >
          {settings.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      {isPullOut && (
        <label className="block text-sm mt-2">
          Provider
          <select
            className="mt-1 w-full border rounded px-2 py-1"
            value={block.providerId ?? ""}
            onChange={(e) =>
              updateBlock(block.id, { providerId: e.target.value || undefined })
            }
          >
            <option value="">(none)</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      )}

      <h3 className="mt-4 font-semibold text-sm">Students</h3>
      {block.studentIds.length === 0 && <p className="text-xs text-slate-500">None assigned.</p>}
      <ul className="mt-1">
        {block.studentIds.map((id) => {
          const s = students.find((x) => x.id === id);
          return (
            <li key={id} className="flex justify-between items-center text-sm py-0.5">
              <span>{s?.name ?? "(deleted)"}</span>
              <button
                className="text-xs text-err hover:underline"
                onClick={() => unassignStudent(block.id, id)}
              >
                remove
              </button>
            </li>
          );
        })}
      </ul>
      {unassignedStudents.length > 0 && (
        <select
          className="mt-1 w-full border rounded px-2 py-1 text-sm"
          value=""
          onChange={(e) => e.target.value && assignStudent(block.id, e.target.value)}
        >
          <option value="">+ add student…</option>
          {unassignedStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}

      <h3 className="mt-4 font-semibold text-sm">Paras</h3>
      {block.paraIds.length === 0 && <p className="text-xs text-slate-500">None assigned.</p>}
      <ul className="mt-1">
        {block.paraIds.map((id) => {
          const p = paras.find((x) => x.id === id);
          return (
            <li key={id} className="flex justify-between items-center text-sm py-0.5">
              <span>{p?.name ?? "(deleted)"}</span>
              <button
                className="text-xs text-err hover:underline"
                onClick={() => unassignPara(block.id, id)}
              >
                remove
              </button>
            </li>
          );
        })}
      </ul>
      {unassignedParas.length > 0 && (
        <select
          className="mt-1 w-full border rounded px-2 py-1 text-sm"
          value=""
          onChange={(e) => e.target.value && assignPara(block.id, e.target.value)}
        >
          <option value="">+ add para…</option>
          {unassignedParas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      <label className="block text-sm mt-4">
        Label (optional)
        <input
          className="mt-1 w-full border rounded px-2 py-1"
          value={block.label ?? ""}
          onChange={(e) => updateBlock(block.id, { label: e.target.value })}
          placeholder="e.g., Reading workshop"
        />
      </label>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center gap-1 text-sm">
          <span>Duration (slots)</span>
          <button
            className="px-2 border rounded"
            onClick={() =>
              updateBlock(block.id, { endSlot: Math.max(block.startSlot + 1, block.endSlot - 1) })
            }
          >
            −
          </button>
          <span>{block.endSlot - block.startSlot}</span>
          <button
            className="px-2 border rounded"
            onClick={() => updateBlock(block.id, { endSlot: block.endSlot + 1 })}
          >
            +
          </button>
        </div>
        <button
          className="text-sm text-err hover:underline"
          onClick={() => {
            deleteBlock(block.id);
            setSelectedBlock(null);
          }}
        >
          Delete block
        </button>
      </div>
    </div>
  );
}
