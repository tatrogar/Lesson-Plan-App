import type { CellStyle, DayCell } from "../types";
import { cellStyleClass } from "../lib/colors";

interface Props {
  value: DayCell;
  onChange: (patch: Partial<DayCell>) => void;
}

const NEXT_STYLE: Record<CellStyle, CellStyle> = {
  normal: "pullout",
  pullout: "unavailable",
  unavailable: "normal",
};

const STYLE_LABEL: Record<CellStyle, string> = {
  normal: "Normal",
  pullout: "Pull-out (orange)",
  unavailable: "Unavailable (gray)",
};

export function DayCellEditor({ value, onChange }: Props) {
  return (
    <div
      className={`group relative h-full min-h-[48px] ${cellStyleClass[value.style]}`}
    >
      <textarea
        value={value.text}
        onChange={(e) => onChange({ text: e.target.value })}
        disabled={value.style === "unavailable"}
        className={`h-full w-full resize-none bg-transparent p-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
          value.style === "unavailable" ? "cursor-not-allowed" : ""
        }`}
        rows={2}
      />
      <button
        type="button"
        title={`Style: ${STYLE_LABEL[value.style]} (click to change)`}
        onClick={() => onChange({ style: NEXT_STYLE[value.style] })}
        className="absolute right-0.5 top-0.5 hidden rounded bg-white/80 px-1 text-[10px] text-slate-600 shadow group-hover:block hover:bg-white"
      >
        {value.style === "normal" ? "○" : value.style === "pullout" ? "●" : "×"}
      </button>
    </div>
  );
}
