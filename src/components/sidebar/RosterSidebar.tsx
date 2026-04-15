import { useDraggable } from "@dnd-kit/core";
import { useScheduleStore } from "../../state/useScheduleStore";
import type { Para, Student } from "../../domain/types";

function StudentChip({ student }: { student: Student }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `stu:${student.id}`,
  });
  const setEditing = useScheduleStore((s) => s.setEditingStudent);
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`px-2 py-1 rounded border bg-indigo-50 border-indigo-300 cursor-grab text-sm flex justify-between items-center ${isDragging ? "opacity-40" : ""}`}
    >
      <span>
        <span className="font-medium">{student.name}</span>{" "}
        <span className="text-xs text-slate-500">({student.grade}, {student.supportLevel})</span>
      </span>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setEditing(student.id)}
        className="text-xs text-indigo-700 hover:underline"
      >
        edit
      </button>
    </div>
  );
}

function ParaChip({ para }: { para: Para }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `par:${para.id}`,
  });
  const setEditing = useScheduleStore((s) => s.setEditingPara);
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`px-2 py-1 rounded border bg-amber-50 border-amber-300 cursor-grab text-sm flex justify-between items-center ${isDragging ? "opacity-40" : ""}`}
    >
      <span className="font-medium">{para.name}</span>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setEditing(para.id)}
        className="text-xs text-amber-800 hover:underline"
      >
        edit
      </button>
    </div>
  );
}

export default function RosterSidebar() {
  const students = useScheduleStore((s) => s.roster.students);
  const paras = useScheduleStore((s) => s.roster.paras);

  return (
    <aside className="no-print w-64 border-r bg-white overflow-y-auto p-3 flex flex-col gap-4">
      <div>
        <h2 className="text-xs font-semibold uppercase text-slate-500 mb-1">Students</h2>
        {students.length === 0 ? (
          <p className="text-xs text-slate-400">Add students via the Roster tab.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {students.map((s) => (
              <StudentChip key={s.id} student={s} />
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-xs font-semibold uppercase text-slate-500 mb-1">Paras</h2>
        {paras.length === 0 ? (
          <p className="text-xs text-slate-400">Add paras via the Roster tab.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {paras.map((p) => (
              <ParaChip key={p.id} para={p} />
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500 mt-auto">
        Drag a student or para onto a grid cell to assign. Drag onto an existing block to add.
      </p>
    </aside>
  );
}
