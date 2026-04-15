// Domain types for the SpEd Scheduler app.
// Times are stored as "minutes since midnight" (0-1439). Slots are indices
// into a grid that starts at AppSettings.dayStart and steps by slotMinutes.

export type SettingKind =
  | "gen-ed"
  | "sped"
  | "ot"
  | "speech"
  | "lunch"
  | "specials";

export type SupportLevel = "1:1" | "small-group" | "independent";

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";

export interface IEPTargets {
  // Weekly IEP service minute targets.
  genEdMinutesWeek: number;
  spedMinutesWeek: number;
  otMinutesWeek: number;
  speechMinutesWeek: number;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  iep: IEPTargets;
  supportLevel: SupportLevel;
  transitionThreshold: number; // warn if >N transitions/day
}

export interface ParaLunchRule {
  lengthMin: number; // required lunch length
  windowStart: number; // earliest minutes-since-midnight
  windowEnd: number; // latest minutes-since-midnight for lunch to end
}

export interface Para {
  id: string;
  name: string;
  shiftStart: number; // minutes since midnight
  shiftEnd: number;
  lunch: ParaLunchRule;
  maxConsecutiveMin: number;
  maxDailyMin: number;
  transitionThreshold: number;
}

export interface Setting {
  id: string;
  name: string;
  kind: SettingKind;
}

export interface Block {
  id: string;
  day: DayOfWeek;
  startSlot: number; // slot index
  endSlot: number; // exclusive
  settingId: string;
  studentIds: string[];
  paraIds: string[];
  providerId?: string; // OT or Speech provider name
  label?: string;
}

export interface AppSettings {
  dayStart: number; // minutes since midnight, e.g. 8:00 -> 480
  dayEnd: number; // e.g. 15:30 -> 930
  slotMinutes: number; // e.g. 15
  activeDays: DayOfWeek[];
}

export interface Roster {
  students: Student[];
  paras: Para[];
  settings: Setting[];
  providers: string[]; // names of OT/Speech providers
}

export interface ScheduleData {
  blocks: Record<string, Block>;
}

// Warnings produced by the pure engine.
export type WarningSeverity = "error" | "warn" | "info";

interface BaseWarning {
  id: string;
  severity: WarningSeverity;
  message: string;
  blockIds?: string[];
}

export interface StudentMinuteWarning extends BaseWarning {
  kind: "student-minutes";
  studentId: string;
  setting: "gen-ed" | "sped" | "ot" | "speech";
  targetMin: number;
  actualMin: number;
  deltaMin: number; // negative = short
}

export interface StudentTransitionWarning extends BaseWarning {
  kind: "student-transitions";
  studentId: string;
  day: DayOfWeek;
  count: number;
  threshold: number;
}

export interface StudentDoubleBookedWarning extends BaseWarning {
  kind: "student-double-booked";
  studentId: string;
  day: DayOfWeek;
}

export interface StudentSupportWarning extends BaseWarning {
  kind: "student-support";
  studentId: string;
  day: DayOfWeek;
}

export interface ParaLunchWarning extends BaseWarning {
  kind: "para-lunch";
  paraId: string;
  day: DayOfWeek;
}

export interface ParaConsecutiveWarning extends BaseWarning {
  kind: "para-consecutive";
  paraId: string;
  day: DayOfWeek;
  consecutiveMin: number;
  limit: number;
}

export interface ParaDailyMaxWarning extends BaseWarning {
  kind: "para-daily-max";
  paraId: string;
  day: DayOfWeek;
  workedMin: number;
  limit: number;
}

export interface ParaDoubleBookedWarning extends BaseWarning {
  kind: "para-double-booked";
  paraId: string;
  day: DayOfWeek;
}

export interface ParaTransitionWarning extends BaseWarning {
  kind: "para-transitions";
  paraId: string;
  day: DayOfWeek;
  count: number;
  threshold: number;
}

export interface ProviderConflictWarning extends BaseWarning {
  kind: "provider-conflict";
  providerId: string;
  day: DayOfWeek;
}

export type Warning =
  | StudentMinuteWarning
  | StudentTransitionWarning
  | StudentDoubleBookedWarning
  | StudentSupportWarning
  | ParaLunchWarning
  | ParaConsecutiveWarning
  | ParaDailyMaxWarning
  | ParaDoubleBookedWarning
  | ParaTransitionWarning
  | ProviderConflictWarning;
