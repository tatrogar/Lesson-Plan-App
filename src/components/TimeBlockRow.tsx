import { DAYS, SESSION_TYPES, type SessionRow, type TimeBlock } from "../types";
import { usePlanStore } from "../state/usePlanStore";
import { sessionColor } from "../lib/colors";
import { DayCellEditor } from "./DayCellEditor";

interface Props {
  planId: string;
  block: TimeBlock;
}

export function TimeBlockRow({ planId, block }: Props) {
  const {
    addRow,
    removeRow,
    removeTimeBlock,
    updateRow,
    updateDayCell,
    updateTimeLabel,
  } = usePlanStore();

  return (
    <>
      {block.rows.map((row, idx) => (
        <tr key={row.id} className="border-b border-slate-300">
          {idx === 0 && (
            <td
              rowSpan={block.rows.length}
              className="border-r border-slate-300 bg-slate-50 p-1 align-top"
            >
              <input
                value={block.time}
                onChange={(e) =>
                  updateTimeLabel(planId, block.id, e.target.value)
                }
                className="w-20 bg-transparent text-center text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <div className="mt-1 flex flex-col gap-1 no-print">
                <button
                  onClick={() => addRow(planId, block.id)}
                  title="Add session row"
                  className="rounded bg-slate-200 px-1 text-[10px] hover:bg-slate-300"
                >
                  + row
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this time block?"))
                      removeTimeBlock(planId, block.id);
                  }}
                  title="Delete time block"
                  className="rounded bg-rose-100 px-1 text-[10px] text-rose-700 hover:bg-rose-200"
                >
                  × block
                </button>
              </div>
            </td>
          )}

          <SessionCell
            row={row}
            onNameChange={(name) => updateRow(planId, block.id, row.id, { name })}
            onTypeChange={(type) =>
              updateRow(planId, block.id, row.id, { type })
            }
            onDelete={
              block.rows.length > 1
                ? () => removeRow(planId, block.id, row.id)
                : undefined
            }
          />

          <td className="border-r border-slate-300 p-0">
            <input
              value={row.status}
              onChange={(e) =>
                updateRow(planId, block.id, row.id, { status: e.target.value })
              }
              className="h-full w-full bg-transparent p-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </td>

          {DAYS.map((d) => (
            <td key={d.key} className="border-r border-slate-300 p-0">
              <DayCellEditor
                value={row.days[d.key]}
                onChange={(patch) =>
                  updateDayCell(planId, block.id, row.id, d.key, patch)
                }
              />
            </td>
          ))}

          <td className="border-r border-slate-300 p-0">
            <textarea
              value={row.materials}
              onChange={(e) =>
                updateRow(planId, block.id, row.id, {
                  materials: e.target.value,
                })
              }
              rows={2}
              className="h-full w-full resize-none bg-transparent p-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </td>

          <td className="p-0">
            <textarea
              value={row.notes}
              onChange={(e) =>
                updateRow(planId, block.id, row.id, { notes: e.target.value })
              }
              rows={2}
              className="h-full w-full resize-none bg-transparent p-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </td>
        </tr>
      ))}
    </>
  );
}

interface SessionCellProps {
  row: SessionRow;
  onNameChange: (name: string) => void;
  onTypeChange: (type: SessionRow["type"]) => void;
  onDelete?: () => void;
}

function SessionCell({
  row,
  onNameChange,
  onTypeChange,
  onDelete,
}: SessionCellProps) {
  return (
    <td
      className={`group relative border-r border-slate-300 p-0 ${sessionColor[row.type]}`}
    >
      <input
        value={row.name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Session name"
        className="w-full bg-transparent p-1 text-xs font-medium placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <div className="flex items-center justify-between gap-1 px-1 pb-1 no-print">
        <select
          value={row.type}
          onChange={(e) => onTypeChange(e.target.value as SessionRow["type"])}
          className="w-full rounded border border-white/60 bg-white/60 px-1 text-[10px]"
        >
          {SESSION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {onDelete && (
          <button
            onClick={onDelete}
            title="Delete row"
            className="rounded px-1 text-[10px] text-rose-700 opacity-0 hover:bg-white/60 group-hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
    </td>
  );
}
