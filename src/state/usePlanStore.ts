import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  DayCell,
  DayKey,
  SessionRow,
  SessionType,
  TimeBlock,
  WeeklyPlan,
} from "../types";
import { buildDefaultPlan, uid } from "../lib/defaults";

interface PlanStore {
  plans: WeeklyPlan[];
  createPlan: (weekOf: string, useSample: boolean) => string;
  deletePlan: (id: string) => void;
  duplicatePlan: (id: string) => string | null;
  updateWeekOf: (id: string, weekOf: string) => void;

  addTimeBlock: (planId: string, time: string) => void;
  removeTimeBlock: (planId: string, blockId: string) => void;
  updateTimeLabel: (planId: string, blockId: string, time: string) => void;

  addRow: (planId: string, blockId: string) => void;
  removeRow: (planId: string, blockId: string, rowId: string) => void;
  updateRow: (
    planId: string,
    blockId: string,
    rowId: string,
    patch: Partial<Pick<SessionRow, "name" | "type" | "status" | "materials" | "notes">>,
  ) => void;
  updateDayCell: (
    planId: string,
    blockId: string,
    rowId: string,
    day: DayKey,
    patch: Partial<DayCell>,
  ) => void;
}

function mapPlan(
  state: PlanStore,
  planId: string,
  mutate: (p: WeeklyPlan) => WeeklyPlan,
): WeeklyPlan[] {
  return state.plans.map((p) =>
    p.id === planId ? { ...mutate(p), updatedAt: new Date().toISOString() } : p,
  );
}

function mapBlock(
  plan: WeeklyPlan,
  blockId: string,
  mutate: (b: TimeBlock) => TimeBlock,
): WeeklyPlan {
  return {
    ...plan,
    timeBlocks: plan.timeBlocks.map((b) => (b.id === blockId ? mutate(b) : b)),
  };
}

function mapRow(
  block: TimeBlock,
  rowId: string,
  mutate: (r: SessionRow) => SessionRow,
): TimeBlock {
  return {
    ...block,
    rows: block.rows.map((r) => (r.id === rowId ? mutate(r) : r)),
  };
}

export const usePlanStore = create<PlanStore>()(
  persist(
    (set) => ({
      plans: [],

      createPlan: (weekOf, useSample) => {
        const plan = useSample
          ? buildDefaultPlan(weekOf)
          : buildDefaultPlan(weekOf);
        set((state) => ({ plans: [plan, ...state.plans] }));
        return plan.id;
      },

      deletePlan: (id) =>
        set((state) => ({ plans: state.plans.filter((p) => p.id !== id) })),

      duplicatePlan: (id) => {
        let newId: string | null = null;
        set((state) => {
          const original = state.plans.find((p) => p.id === id);
          if (!original) return state;
          newId = uid();
          const copy: WeeklyPlan = {
            ...original,
            id: newId,
            weekOf: original.weekOf,
            timeBlocks: original.timeBlocks.map((b) => ({
              ...b,
              id: uid(),
              rows: b.rows.map((r) => ({
                ...r,
                id: uid(),
                days: { ...r.days },
              })),
            })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { plans: [copy, ...state.plans] };
        });
        return newId;
      },

      updateWeekOf: (id, weekOf) =>
        set((state) => ({
          plans: mapPlan(state, id, (p) => ({ ...p, weekOf })),
        })),

      addTimeBlock: (planId, time) =>
        set((state) => ({
          plans: mapPlan(state, planId, (p) => ({
            ...p,
            timeBlocks: [
              ...p.timeBlocks,
              {
                id: uid(),
                time,
                rows: [
                  {
                    id: uid(),
                    name: "",
                    type: "independent" as SessionType,
                    status: "",
                    days: {
                      mon: { text: "", style: "normal" },
                      tue: { text: "", style: "normal" },
                      wed: { text: "", style: "normal" },
                      thu: { text: "", style: "normal" },
                      fri: { text: "", style: "normal" },
                    },
                    materials: "",
                    notes: "",
                  },
                ],
              },
            ],
          })),
        })),

      removeTimeBlock: (planId, blockId) =>
        set((state) => ({
          plans: mapPlan(state, planId, (p) => ({
            ...p,
            timeBlocks: p.timeBlocks.filter((b) => b.id !== blockId),
          })),
        })),

      updateTimeLabel: (planId, blockId, time) =>
        set((state) => ({
          plans: mapPlan(state, planId, (p) =>
            mapBlock(p, blockId, (b) => ({ ...b, time })),
          ),
        })),

      addRow: (planId, blockId) =>
        set((state) => ({
          plans: mapPlan(state, planId, (p) =>
            mapBlock(p, blockId, (b) => ({
              ...b,
              rows: [
                ...b.rows,
                {
                  id: uid(),
                  name: "",
                  type: "independent" as SessionType,
                  status: "",
                  days: {
                    mon: { text: "", style: "normal" },
                    tue: { text: "", style: "normal" },
                    wed: { text: "", style: "normal" },
                    thu: { text: "", style: "normal" },
                    fri: { text: "", style: "normal" },
                  },
                  materials: "",
                  notes: "",
                },
              ],
            })),
          ),
        })),

      removeRow: (planId, blockId, rowId) =>
        set((state) => ({
          plans: mapPlan(state, planId, (p) =>
            mapBlock(p, blockId, (b) => ({
              ...b,
              rows: b.rows.filter((r) => r.id !== rowId),
            })),
          ),
        })),

      updateRow: (planId, blockId, rowId, patch) =>
        set((state) => ({
          plans: mapPlan(state, planId, (p) =>
            mapBlock(p, blockId, (b) =>
              mapRow(b, rowId, (r) => ({ ...r, ...patch })),
            ),
          ),
        })),

      updateDayCell: (planId, blockId, rowId, day, patch) =>
        set((state) => ({
          plans: mapPlan(state, planId, (p) =>
            mapBlock(p, blockId, (b) =>
              mapRow(b, rowId, (r) => ({
                ...r,
                days: { ...r.days, [day]: { ...r.days[day], ...patch } },
              })),
            ),
          ),
        })),
    }),
    { name: "lesson-plan-app" },
  ),
);
