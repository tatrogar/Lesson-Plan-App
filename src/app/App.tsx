import { useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useScheduleStore } from "../state/useScheduleStore";
import { computeWarnings } from "../domain/warnings";
import TopBar from "../components/TopBar";
import RosterSidebar from "../components/sidebar/RosterSidebar";
import ScheduleGrid from "../components/grid/ScheduleGrid";
import WarningsPanel from "../components/warnings/WarningsPanel";
import StudentDrawer from "../components/drawers/StudentDrawer";
import ParaDrawer from "../components/drawers/ParaDrawer";
import BlockDrawer from "../components/drawers/BlockDrawer";
import RosterEditor from "../components/roster/RosterEditor";
import StudentDayPrint from "../components/print/StudentDayPrint";
import ParaDayPrint from "../components/print/ParaDayPrint";

type Route =
  | { name: "schedule" }
  | { name: "roster" }
  | { name: "print-student"; id: string }
  | { name: "print-para"; id: string };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#/, "");
  if (h.startsWith("/roster")) return { name: "roster" };
  const ps = h.match(/^\/print\/student\/(.+)$/);
  if (ps) return { name: "print-student", id: ps[1] };
  const pp = h.match(/^\/print\/para\/(.+)$/);
  if (pp) return { name: "print-para", id: pp[1] };
  return { name: "schedule" };
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash());
  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const schedule = useScheduleStore((s) => s.schedule);
  const roster = useScheduleStore((s) => s.roster);
  const appSettings = useScheduleStore((s) => s.appSettings);
  const createBlock = useScheduleStore((s) => s.createBlock);
  const assignStudent = useScheduleStore((s) => s.assignStudent);
  const assignPara = useScheduleStore((s) => s.assignPara);
  const moveBlock = useScheduleStore((s) => s.moveBlock);

  const warnings = useMemo(
    () => computeWarnings(schedule, roster, appSettings),
    [schedule, roster, appSettings]
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;

    // active id formats: stu:<id> | par:<id> | blk:<id>
    // over id formats:   cell:<day>:<slot>:<settingId> | block:<blockId>
    const [aKind, aRef] = activeId.split(":");
    if (overId.startsWith("cell:")) {
      const [, day, slotStr, settingId] = overId.split(":");
      const slot = parseInt(slotStr, 10);
      if (aKind === "blk") {
        moveBlock(aRef, { day: day as any, startSlot: slot });
      } else if (aKind === "stu") {
        const id = createBlock({
          day: day as any,
          startSlot: slot,
          endSlot: slot + 2, // default 30 min
          settingId,
          studentId: aRef,
        });
        useScheduleStore.getState().setSelectedBlock(id);
      } else if (aKind === "par") {
        const id = createBlock({
          day: day as any,
          startSlot: slot,
          endSlot: slot + 2,
          settingId,
          paraId: aRef,
        });
        useScheduleStore.getState().setSelectedBlock(id);
      }
    } else if (overId.startsWith("block:")) {
      const blockId = overId.split(":")[1];
      if (aKind === "stu") assignStudent(blockId, aRef);
      else if (aKind === "par") assignPara(blockId, aRef);
    }
  }

  if (route.name === "print-student") {
    return <StudentDayPrint studentId={route.id} />;
  }
  if (route.name === "print-para") {
    return <ParaDayPrint paraId={route.id} />;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col">
        <TopBar route={route.name} warnings={warnings} />
        {route.name === "roster" ? (
          <RosterEditor />
        ) : (
          <div className="flex-1 flex min-h-0">
            <RosterSidebar />
            <ScheduleGrid warnings={warnings} />
            <WarningsPanel warnings={warnings} />
          </div>
        )}
      </div>
      <StudentDrawer />
      <ParaDrawer />
      <BlockDrawer />
    </DndContext>
  );
}
