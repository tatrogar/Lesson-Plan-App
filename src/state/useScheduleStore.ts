import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppSettings,
  Block,
  DayOfWeek,
  Para,
  Roster,
  ScheduleData,
  Setting,
  Student,
} from "../domain/types";
import {
  DAYS,
  DEFAULT_DAY_END,
  DEFAULT_DAY_START,
  DEFAULT_SETTINGS,
  DEFAULT_SLOT_MIN,
} from "../domain/constants";
import { uid } from "../domain/timeUtils";

export interface UIState {
  selectedDay: DayOfWeek;
  selectedBlockId: string | null;
  editingStudentId: string | null;
  editingParaId: string | null;
}

export interface StoreState {
  roster: Roster;
  appSettings: AppSettings;
  schedule: ScheduleData;
  ui: UIState;

  // Roster actions
  addStudent: (s: Omit<Student, "id">) => void;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  removeStudent: (id: string) => void;
  addPara: (p: Omit<Para, "id">) => void;
  updatePara: (id: string, patch: Partial<Para>) => void;
  removePara: (id: string) => void;
  addSetting: (s: Omit<Setting, "id">) => void;
  removeSetting: (id: string) => void;
  addProvider: (name: string) => void;
  removeProvider: (name: string) => void;

  // Schedule actions
  createBlock: (args: {
    day: DayOfWeek;
    startSlot: number;
    endSlot: number;
    settingId: string;
    studentId?: string;
    paraId?: string;
  }) => string;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  assignStudent: (blockId: string, studentId: string) => void;
  unassignStudent: (blockId: string, studentId: string) => void;
  assignPara: (blockId: string, paraId: string) => void;
  unassignPara: (blockId: string, paraId: string) => void;
  moveBlock: (id: string, dayAndStart: { day: DayOfWeek; startSlot: number }) => void;
  resizeBlock: (id: string, endSlot: number) => void;

  // UI
  setSelectedDay: (d: DayOfWeek) => void;
  setSelectedBlock: (id: string | null) => void;
  setEditingStudent: (id: string | null) => void;
  setEditingPara: (id: string | null) => void;

  // App settings
  updateAppSettings: (patch: Partial<AppSettings>) => void;

  // Utility
  resetAll: () => void;
  loadSample: () => void;
}

const initialRoster: Roster = {
  students: [],
  paras: [],
  settings: DEFAULT_SETTINGS,
  providers: ["OT: Ms. Chen", "Speech: Mr. Ortiz"],
};

const initialAppSettings: AppSettings = {
  dayStart: DEFAULT_DAY_START,
  dayEnd: DEFAULT_DAY_END,
  slotMinutes: DEFAULT_SLOT_MIN,
  activeDays: DAYS,
};

const initialUI: UIState = {
  selectedDay: "Mon",
  selectedBlockId: null,
  editingStudentId: null,
  editingParaId: null,
};

export const useScheduleStore = create<StoreState>()(
  persist(
    (set, get) => ({
      roster: initialRoster,
      appSettings: initialAppSettings,
      schedule: { blocks: {} },
      ui: initialUI,

      addStudent: (s) =>
        set((st) => ({
          roster: { ...st.roster, students: [...st.roster.students, { ...s, id: uid("stu") }] },
        })),
      updateStudent: (id, patch) =>
        set((st) => ({
          roster: {
            ...st.roster,
            students: st.roster.students.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          },
        })),
      removeStudent: (id) =>
        set((st) => ({
          roster: { ...st.roster, students: st.roster.students.filter((x) => x.id !== id) },
          schedule: {
            blocks: Object.fromEntries(
              Object.entries(st.schedule.blocks).map(([k, b]) => [
                k,
                { ...b, studentIds: b.studentIds.filter((x) => x !== id) },
              ])
            ),
          },
        })),

      addPara: (p) =>
        set((st) => ({
          roster: { ...st.roster, paras: [...st.roster.paras, { ...p, id: uid("par") }] },
        })),
      updatePara: (id, patch) =>
        set((st) => ({
          roster: {
            ...st.roster,
            paras: st.roster.paras.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          },
        })),
      removePara: (id) =>
        set((st) => ({
          roster: { ...st.roster, paras: st.roster.paras.filter((x) => x.id !== id) },
          schedule: {
            blocks: Object.fromEntries(
              Object.entries(st.schedule.blocks).map(([k, b]) => [
                k,
                { ...b, paraIds: b.paraIds.filter((x) => x !== id) },
              ])
            ),
          },
        })),

      addSetting: (s) =>
        set((st) => ({
          roster: { ...st.roster, settings: [...st.roster.settings, { ...s, id: uid("set") }] },
        })),
      removeSetting: (id) =>
        set((st) => ({
          roster: { ...st.roster, settings: st.roster.settings.filter((x) => x.id !== id) },
        })),

      addProvider: (name) =>
        set((st) => ({
          roster: {
            ...st.roster,
            providers: st.roster.providers.includes(name)
              ? st.roster.providers
              : [...st.roster.providers, name],
          },
        })),
      removeProvider: (name) =>
        set((st) => ({
          roster: { ...st.roster, providers: st.roster.providers.filter((x) => x !== name) },
        })),

      createBlock: ({ day, startSlot, endSlot, settingId, studentId, paraId }) => {
        const id = uid("blk");
        set((st) => ({
          schedule: {
            blocks: {
              ...st.schedule.blocks,
              [id]: {
                id,
                day,
                startSlot,
                endSlot,
                settingId,
                studentIds: studentId ? [studentId] : [],
                paraIds: paraId ? [paraId] : [],
              },
            },
          },
        }));
        return id;
      },
      updateBlock: (id, patch) =>
        set((st) => {
          const b = st.schedule.blocks[id];
          if (!b) return st;
          return {
            schedule: { blocks: { ...st.schedule.blocks, [id]: { ...b, ...patch } } },
          };
        }),
      deleteBlock: (id) =>
        set((st) => {
          const rest = { ...st.schedule.blocks };
          delete rest[id];
          return { schedule: { blocks: rest } };
        }),

      assignStudent: (blockId, studentId) =>
        set((st) => {
          const b = st.schedule.blocks[blockId];
          if (!b || b.studentIds.includes(studentId)) return st;
          return {
            schedule: {
              blocks: {
                ...st.schedule.blocks,
                [blockId]: { ...b, studentIds: [...b.studentIds, studentId] },
              },
            },
          };
        }),
      unassignStudent: (blockId, studentId) =>
        set((st) => {
          const b = st.schedule.blocks[blockId];
          if (!b) return st;
          return {
            schedule: {
              blocks: {
                ...st.schedule.blocks,
                [blockId]: { ...b, studentIds: b.studentIds.filter((x) => x !== studentId) },
              },
            },
          };
        }),
      assignPara: (blockId, paraId) =>
        set((st) => {
          const b = st.schedule.blocks[blockId];
          if (!b || b.paraIds.includes(paraId)) return st;
          return {
            schedule: {
              blocks: {
                ...st.schedule.blocks,
                [blockId]: { ...b, paraIds: [...b.paraIds, paraId] },
              },
            },
          };
        }),
      unassignPara: (blockId, paraId) =>
        set((st) => {
          const b = st.schedule.blocks[blockId];
          if (!b) return st;
          return {
            schedule: {
              blocks: {
                ...st.schedule.blocks,
                [blockId]: { ...b, paraIds: b.paraIds.filter((x) => x !== paraId) },
              },
            },
          };
        }),
      moveBlock: (id, { day, startSlot }) =>
        set((st) => {
          const b = st.schedule.blocks[id];
          if (!b) return st;
          const len = b.endSlot - b.startSlot;
          return {
            schedule: {
              blocks: {
                ...st.schedule.blocks,
                [id]: { ...b, day, startSlot, endSlot: startSlot + len },
              },
            },
          };
        }),
      resizeBlock: (id, endSlot) =>
        set((st) => {
          const b = st.schedule.blocks[id];
          if (!b) return st;
          if (endSlot <= b.startSlot) return st;
          return {
            schedule: { blocks: { ...st.schedule.blocks, [id]: { ...b, endSlot } } },
          };
        }),

      setSelectedDay: (d) => set((st) => ({ ui: { ...st.ui, selectedDay: d } })),
      setSelectedBlock: (id) => set((st) => ({ ui: { ...st.ui, selectedBlockId: id } })),
      setEditingStudent: (id) => set((st) => ({ ui: { ...st.ui, editingStudentId: id } })),
      setEditingPara: (id) => set((st) => ({ ui: { ...st.ui, editingParaId: id } })),

      updateAppSettings: (patch) =>
        set((st) => ({ appSettings: { ...st.appSettings, ...patch } })),

      resetAll: () =>
        set({
          roster: initialRoster,
          appSettings: initialAppSettings,
          schedule: { blocks: {} },
          ui: initialUI,
        }),

      loadSample: () => {
        const sample = buildSample();
        set({ ...sample, ui: initialUI });
        // Give IDs by re-adding — but buildSample already uses uid() so fine.
        void get;
      },
    }),
    {
      name: "sped-scheduler-v1",
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        // Future schema migrations go here.
        if (version === 1) return persisted as StoreState;
        return persisted as StoreState;
      },
    }
  )
);

// ------------- Sample data for demo / verification -------------
function buildSample(): Pick<StoreState, "roster" | "appSettings" | "schedule"> {
  const appSettings: AppSettings = { ...initialAppSettings };
  const settings = DEFAULT_SETTINGS;
  const students: Student[] = [
    {
      id: uid("stu"),
      name: "Avery",
      grade: "3",
      iep: { genEdMinutesWeek: 900, spedMinutesWeek: 450, otMinutesWeek: 60, speechMinutesWeek: 60 },
      supportLevel: "small-group",
      transitionThreshold: 4,
    },
    {
      id: uid("stu"),
      name: "Blake",
      grade: "4",
      iep: { genEdMinutesWeek: 600, spedMinutesWeek: 750, otMinutesWeek: 30, speechMinutesWeek: 0 },
      supportLevel: "1:1",
      transitionThreshold: 3,
    },
    {
      id: uid("stu"),
      name: "Cory",
      grade: "3",
      iep: { genEdMinutesWeek: 1200, spedMinutesWeek: 150, otMinutesWeek: 0, speechMinutesWeek: 60 },
      supportLevel: "independent",
      transitionThreshold: 5,
    },
  ];
  const paras: Para[] = [
    {
      id: uid("par"),
      name: "Ms. Jordan",
      shiftStart: 8 * 60,
      shiftEnd: 15 * 60 + 30,
      lunch: { lengthMin: 30, windowStart: 11 * 60, windowEnd: 13 * 60 },
      maxConsecutiveMin: 180,
      maxDailyMin: 390,
      transitionThreshold: 5,
    },
    {
      id: uid("par"),
      name: "Mr. Kim",
      shiftStart: 8 * 60,
      shiftEnd: 15 * 60 + 30,
      lunch: { lengthMin: 30, windowStart: 11 * 60 + 30, windowEnd: 13 * 60 + 30 },
      maxConsecutiveMin: 180,
      maxDailyMin: 390,
      transitionThreshold: 5,
    },
  ];
  return {
    roster: { students, paras, settings, providers: initialRoster.providers },
    appSettings,
    schedule: { blocks: {} },
  };
}
