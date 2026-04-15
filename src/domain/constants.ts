import type { DayOfWeek, Setting } from "./types";

export const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export const DEFAULT_SETTINGS: Setting[] = [
  { id: "set_gen_ed", name: "Gen-Ed Classroom", kind: "gen-ed" },
  { id: "set_sped", name: "SpEd Resource", kind: "sped" },
  { id: "set_ot", name: "OT Room", kind: "ot" },
  { id: "set_speech", name: "Speech Room", kind: "speech" },
  { id: "set_specials", name: "Specials", kind: "specials" },
  { id: "set_lunch", name: "Lunch", kind: "lunch" },
];

// Default daily school window: 8:00 - 15:30, 15-min slots.
export const DEFAULT_DAY_START = 8 * 60;
export const DEFAULT_DAY_END = 15 * 60 + 30;
export const DEFAULT_SLOT_MIN = 15;
