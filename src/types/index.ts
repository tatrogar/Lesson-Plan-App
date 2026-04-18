export type SessionType =
  | "reading"
  | "writing"
  | "math"
  | "sel"
  | "transition"
  | "para"
  | "independent";

export type CellStyle = "normal" | "pullout" | "unavailable";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";

export interface DayCell {
  text: string;
  style: CellStyle;
}

export interface SessionRow {
  id: string;
  name: string;
  type: SessionType;
  status: string;
  days: Record<DayKey, DayCell>;
  materials: string;
  notes: string;
}

export interface TimeBlock {
  id: string;
  time: string;
  rows: SessionRow[];
}

export interface WeeklyPlan {
  id: string;
  weekOf: string;
  timeBlocks: TimeBlock[];
  createdAt: string;
  updatedAt: string;
}

export const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
];

export const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "reading", label: "Reading" },
  { value: "writing", label: "Writing" },
  { value: "math", label: "Math" },
  { value: "sel", label: "SEL" },
  { value: "transition", label: "Transition" },
  { value: "para", label: "Para" },
  { value: "independent", label: "Independent" },
];
