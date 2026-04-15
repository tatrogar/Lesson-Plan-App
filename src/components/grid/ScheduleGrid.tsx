import { useDroppable, useDraggable } from "@dnd-kit/core";
import { useScheduleStore } from "../../state/useScheduleStore";
import { slotCount, slotToMinutes, formatTime12 } from "../../domain/timeUtils";
import type { Block, Setting, Warning } from "../../domain/types";

interface Props {
  warnings: Warning[];
}

function Cell({
  day,
  slot,
  settingId,
}: {
  day: string;
  slot: number;
  settingId: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${day}:${slot}:${settingId}`,
  });
  return (
    <div
      ref={setNodeRef}
      className={`h-6 border-b border-slate-100 ${isOver ? "bg-indigo-100" : ""}`}
    />
  );
}

function BlockCard({
  block,
  setting,
  blockWarnings,
}: {
  block: Block;
  setting: Setting;
  blockWarnings: Warning[];
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `blk:${block.id}`,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `block:${block.id}`,
  });
  const selectedBlockId = useScheduleStore((s) => s.ui.selectedBlockId);
  const setSelectedBlock = useScheduleStore((s) => s.setSelectedBlock);
  const students = useScheduleStore((s) => s.roster.students);
  const paras = useScheduleStore((s) => s.roster.paras);
  const resizeBlock = useScheduleStore((s) => s.resizeBlock);

  const studentNames = block.studentIds
    .map((id) => students.find((x) => x.id === id)?.name)
    .filter(Boolean)
    .join(", ");
  const paraNames = block.paraIds
    .map((id) => paras.find((x) => x.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  const selected = selectedBlockId === block.id;
  const hasError = blockWarnings.some((w) => w.severity === "error");
  const hasWarn = blockWarnings.some((w) => w.severity === "warn");

  const className =
    `setting-${setting.kind} block-card absolute left-0.5 right-0.5 border rounded px-1 py-0.5 text-xs overflow-hidden cursor-grab shadow-sm ` +
    (selected ? "ring-2 ring-indigo-600 " : "") +
    (hasError ? "ring-2 ring-err " : hasWarn ? "ring-2 ring-warn " : "") +
    (isDragging ? "opacity-40 " : "") +
    (isOver ? "bg-indigo-200 " : "");

  // Compose two refs for drag + drop.
  const combinedRef = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    setDropRef(el);
  };

  return (
    <div
      ref={combinedRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedBlock(block.id);
      }}
      className={className}
      style={{
        top: `${block.startSlot * 1.5}rem`,
        height: `${(block.endSlot - block.startSlot) * 1.5 - 0.125}rem`,
      }}
      title={blockWarnings.map((w) => w.message).join("\n")}
    >
      <div className="font-medium truncate">{setting.name}</div>
      {studentNames && <div className="truncate">👦 {studentNames}</div>}
      {paraNames && <div className="truncate">🧑‍🏫 {paraNames}</div>}
      {block.providerId && <div className="truncate text-slate-700">➕ {block.providerId}</div>}
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          const startY = e.clientY;
          const startEnd = block.endSlot;
          const onMove = (ev: PointerEvent) => {
            const deltaSlots = Math.round((ev.clientY - startY) / 24);
            const newEnd = Math.max(block.startSlot + 1, startEnd + deltaSlots);
            resizeBlock(block.id, newEnd);
          };
          const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
          };
          window.addEventListener("pointermove", onMove);
          window.addEventListener("pointerup", onUp);
        }}
        className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize bg-black/10"
      />
    </div>
  );
}

export default function ScheduleGrid({ warnings }: Props) {
  const appSettings = useScheduleStore((s) => s.appSettings);
  const selectedDay = useScheduleStore((s) => s.ui.selectedDay);
  const blocks = useScheduleStore((s) => s.schedule.blocks);
  const settings = useScheduleStore((s) => s.roster.settings);

  const nSlots = slotCount(appSettings.dayStart, appSettings.dayEnd, appSettings.slotMinutes);

  const blocksByBlockId: Record<string, Warning[]> = {};
  for (const w of warnings) {
    if (!w.blockIds) continue;
    for (const bid of w.blockIds) {
      (blocksByBlockId[bid] ||= []).push(w);
    }
  }

  const dayBlocks = Object.values(blocks).filter((b) => b.day === selectedDay);

  return (
    <main className="flex-1 overflow-auto bg-white">
      <div className="flex min-w-max">
        {/* Time column */}
        <div className="sticky left-0 bg-white z-10 border-r">
          <div className="h-8 border-b bg-slate-50 w-16 text-xs flex items-center justify-center font-semibold">
            {selectedDay}
          </div>
          {Array.from({ length: nSlots }, (_, i) => (
            <div key={i} className="h-6 w-16 text-[10px] text-right pr-1 text-slate-500 border-b border-slate-100">
              {i % 2 === 0 ? formatTime12(slotToMinutes(i, appSettings.dayStart, appSettings.slotMinutes)) : ""}
            </div>
          ))}
        </div>

        {/* Setting columns */}
        {settings.map((setting) => {
          const colBlocks = dayBlocks.filter((b) => b.settingId === setting.id);
          return (
            <div key={setting.id} className="w-44 border-r relative">
              <div className={`h-8 border-b text-xs flex items-center justify-center font-semibold setting-${setting.kind}`}>
                {setting.name}
              </div>
              <div className="relative">
                {/* Drop cells */}
                {Array.from({ length: nSlots }, (_, i) => (
                  <Cell key={i} day={selectedDay} slot={i} settingId={setting.id} />
                ))}
                {/* Blocks absolutely positioned */}
                {colBlocks.map((b) => (
                  <BlockCard
                    key={b.id}
                    block={b}
                    setting={setting}
                    blockWarnings={blocksByBlockId[b.id] ?? []}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
