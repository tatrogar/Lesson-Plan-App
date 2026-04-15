import type {
  AppSettings,
  Block,
  DayOfWeek,
  Para,
  Roster,
  ScheduleData,
  Setting,
  Student,
  Warning,
} from "./types";
import { blockDurationMin, slotToMinutes } from "./timeUtils";

interface Context {
  schedule: ScheduleData;
  roster: Roster;
  appSettings: AppSettings;
}

const settingsById = (settings: Setting[]) =>
  new Map(settings.map((s) => [s.id, s]));

/** Group blocks by day, sorted by startSlot. */
function blocksByDay(
  schedule: ScheduleData,
  activeDays: DayOfWeek[]
): Record<DayOfWeek, Block[]> {
  const out: Partial<Record<DayOfWeek, Block[]>> = {};
  for (const d of activeDays) out[d] = [];
  for (const b of Object.values(schedule.blocks)) {
    if (!out[b.day]) out[b.day] = [];
    out[b.day]!.push(b);
  }
  for (const d of Object.keys(out) as DayOfWeek[]) {
    out[d]!.sort((a, b) => a.startSlot - b.startSlot);
  }
  return out as Record<DayOfWeek, Block[]>;
}

/** Return minute-overlap between two blocks (in slots). */
function overlapSlots(a: Block, b: Block): number {
  return Math.max(0, Math.min(a.endSlot, b.endSlot) - Math.max(a.startSlot, b.startSlot));
}

export function computeWarnings(
  schedule: ScheduleData,
  roster: Roster,
  appSettings: AppSettings
): Warning[] {
  const ctx: Context = { schedule, roster, appSettings };
  return [
    ...studentMinuteWarnings(ctx),
    ...studentDoubleBookedWarnings(ctx),
    ...studentSupportWarnings(ctx),
    ...studentTransitionWarnings(ctx),
    ...paraLunchWarnings(ctx),
    ...paraDoubleBookedWarnings(ctx),
    ...paraConsecutiveWarnings(ctx),
    ...paraDailyMaxWarnings(ctx),
    ...paraTransitionWarnings(ctx),
    ...providerConflictWarnings(ctx),
  ];
}

// ---------- Student minutes (weekly totals against IEP targets) ----------
function studentMinuteWarnings({ schedule, roster, appSettings }: Context): Warning[] {
  const byId = settingsById(roster.settings);
  const slotMin = appSettings.slotMinutes;
  const out: Warning[] = [];

  for (const student of roster.students) {
    const totals = { "gen-ed": 0, sped: 0, ot: 0, speech: 0 };
    for (const b of Object.values(schedule.blocks)) {
      if (!b.studentIds.includes(student.id)) continue;
      const s = byId.get(b.settingId);
      if (!s) continue;
      const dur = blockDurationMin(b.startSlot, b.endSlot, slotMin);
      if (s.kind === "gen-ed") totals["gen-ed"] += dur;
      else if (s.kind === "sped") totals.sped += dur;
      else if (s.kind === "ot") totals.ot += dur;
      else if (s.kind === "speech") totals.speech += dur;
    }
    const targets: Array<[keyof typeof totals, number, "gen-ed" | "sped" | "ot" | "speech"]> = [
      ["gen-ed", student.iep.genEdMinutesWeek, "gen-ed"],
      ["sped", student.iep.spedMinutesWeek, "sped"],
      ["ot", student.iep.otMinutesWeek, "ot"],
      ["speech", student.iep.speechMinutesWeek, "speech"],
    ];
    for (const [key, target, setting] of targets) {
      if (target === 0 && totals[key] === 0) continue;
      const delta = totals[key] - target;
      if (delta === 0) continue;
      const short = delta < 0;
      out.push({
        kind: "student-minutes",
        id: `sm_${student.id}_${setting}`,
        severity: short ? "error" : "warn",
        studentId: student.id,
        setting,
        targetMin: target,
        actualMin: totals[key],
        deltaMin: delta,
        message: `${student.name}: ${setting} ${short ? "short" : "over"} by ${Math.abs(delta)} min (have ${totals[key]} / target ${target})`,
      });
    }
  }
  return out;
}

// ---------- Student double-booked on same day ----------
function studentDoubleBookedWarnings({ schedule, roster, appSettings }: Context): Warning[] {
  const byDay = blocksByDay(schedule, appSettings.activeDays);
  const out: Warning[] = [];
  for (const student of roster.students) {
    for (const day of appSettings.activeDays) {
      const mine = byDay[day].filter((b) => b.studentIds.includes(student.id));
      for (let i = 0; i < mine.length; i++) {
        for (let j = i + 1; j < mine.length; j++) {
          if (overlapSlots(mine[i], mine[j]) > 0) {
            out.push({
              kind: "student-double-booked",
              id: `sdb_${student.id}_${day}_${mine[i].id}_${mine[j].id}`,
              severity: "error",
              studentId: student.id,
              day,
              blockIds: [mine[i].id, mine[j].id],
              message: `${student.name} double-booked on ${day}`,
            });
          }
        }
      }
    }
  }
  return out;
}

// ---------- 1:1 support must have a para on gen-ed/sped blocks ----------
function studentSupportWarnings({ schedule, roster, appSettings }: Context): Warning[] {
  const byId = settingsById(roster.settings);
  const out: Warning[] = [];
  for (const b of Object.values(schedule.blocks)) {
    const s = byId.get(b.settingId);
    if (!s) continue;
    if (s.kind === "ot" || s.kind === "speech" || s.kind === "lunch") continue;
    for (const sid of b.studentIds) {
      const student = roster.students.find((x) => x.id === sid);
      if (!student) continue;
      if (student.supportLevel === "1:1" && b.paraIds.length === 0) {
        out.push({
          kind: "student-support",
          id: `ssupp_${b.id}_${sid}`,
          severity: "error",
          studentId: sid,
          day: b.day,
          blockIds: [b.id],
          message: `${student.name} needs 1:1 but no para assigned on ${b.day}`,
        });
      }
    }
    if (!appSettings.activeDays.includes(b.day)) continue;
  }
  return out;
}

// ---------- Student transitions (room changes per day) ----------
function studentTransitionWarnings({ schedule, roster, appSettings }: Context): Warning[] {
  const byDay = blocksByDay(schedule, appSettings.activeDays);
  const out: Warning[] = [];
  for (const student of roster.students) {
    for (const day of appSettings.activeDays) {
      const mine = byDay[day].filter((b) => b.studentIds.includes(student.id));
      let transitions = 0;
      for (let i = 1; i < mine.length; i++) {
        if (mine[i].settingId !== mine[i - 1].settingId) transitions++;
      }
      if (transitions > student.transitionThreshold) {
        out.push({
          kind: "student-transitions",
          id: `str_${student.id}_${day}`,
          severity: "warn",
          studentId: student.id,
          day,
          count: transitions,
          threshold: student.transitionThreshold,
          message: `${student.name}: ${transitions} transitions on ${day} (threshold ${student.transitionThreshold})`,
        });
      }
    }
  }
  return out;
}

// ---------- Para lunch enforcement ----------
function paraLunchWarnings({ schedule, roster, appSettings }: Context): Warning[] {
  const byDay = blocksByDay(schedule, appSettings.activeDays);
  const byId = settingsById(roster.settings);
  const slotMin = appSettings.slotMinutes;
  const out: Warning[] = [];

  for (const para of roster.paras) {
    for (const day of appSettings.activeDays) {
      const mine = byDay[day].filter((b) => b.paraIds.includes(para.id));
      const lunchBlocks = mine.filter((b) => byId.get(b.settingId)?.kind === "lunch");
      const totalLunchMin = lunchBlocks.reduce(
        (sum, b) => sum + blockDurationMin(b.startSlot, b.endSlot, slotMin),
        0
      );
      // Must have lunch of at least required length, ending within window.
      const meets = lunchBlocks.some((b) => {
        const startMin = slotToMinutes(b.startSlot, appSettings.dayStart, slotMin);
        const endMin = slotToMinutes(b.endSlot, appSettings.dayStart, slotMin);
        const dur = endMin - startMin;
        return (
          dur >= para.lunch.lengthMin &&
          startMin >= para.lunch.windowStart &&
          endMin <= para.lunch.windowEnd
        );
      });
      if (!meets) {
        out.push({
          kind: "para-lunch",
          id: `plunch_${para.id}_${day}`,
          severity: "error",
          paraId: para.id,
          day,
          message: `${para.name}: no qualifying lunch on ${day} (have ${totalLunchMin} min, need ${para.lunch.lengthMin} between ${fmt(para.lunch.windowStart)}-${fmt(para.lunch.windowEnd)})`,
        });
      }
    }
  }
  return out;
}

function fmt(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---------- Para double-booked ----------
function paraDoubleBookedWarnings({ schedule, roster, appSettings }: Context): Warning[] {
  const byDay = blocksByDay(schedule, appSettings.activeDays);
  const out: Warning[] = [];
  for (const para of roster.paras) {
    for (const day of appSettings.activeDays) {
      const mine = byDay[day].filter((b) => b.paraIds.includes(para.id));
      for (let i = 0; i < mine.length; i++) {
        for (let j = i + 1; j < mine.length; j++) {
          if (overlapSlots(mine[i], mine[j]) > 0) {
            out.push({
              kind: "para-double-booked",
              id: `pdb_${para.id}_${day}_${mine[i].id}_${mine[j].id}`,
              severity: "error",
              paraId: para.id,
              day,
              blockIds: [mine[i].id, mine[j].id],
              message: `${para.name} double-booked on ${day}`,
            });
          }
        }
      }
    }
  }
  return out;
}

// ---------- Para consecutive minutes ----------
function paraConsecutiveWarnings({ schedule, roster, appSettings }: Context): Warning[] {
  const byDay = blocksByDay(schedule, appSettings.activeDays);
  const byId = settingsById(roster.settings);
  const slotMin = appSettings.slotMinutes;
  const out: Warning[] = [];

  for (const para of roster.paras) {
    for (const day of appSettings.activeDays) {
      // Working blocks = non-lunch blocks assigned to this para, merged by adjacency.
      const mine = byDay[day]
        .filter((b) => b.paraIds.includes(para.id))
        .filter((b) => byId.get(b.settingId)?.kind !== "lunch")
        .sort((a, b) => a.startSlot - b.startSlot);
      let runStart: number | null = null;
      let runEnd: number | null = null;
      const pushRun = () => {
        if (runStart === null || runEnd === null) return;
        const consecutive = (runEnd - runStart) * slotMin;
        if (consecutive > para.maxConsecutiveMin) {
          out.push({
            kind: "para-consecutive",
            id: `pcons_${para.id}_${day}_${runStart}`,
            severity: "warn",
            paraId: para.id,
            day,
            consecutiveMin: consecutive,
            limit: para.maxConsecutiveMin,
            message: `${para.name}: ${consecutive} consecutive min on ${day} (limit ${para.maxConsecutiveMin})`,
          });
        }
        runStart = null;
        runEnd = null;
      };
      for (const b of mine) {
        if (runStart === null) {
          runStart = b.startSlot;
          runEnd = b.endSlot;
        } else if (b.startSlot <= (runEnd ?? 0)) {
          runEnd = Math.max(runEnd!, b.endSlot);
        } else {
          pushRun();
          runStart = b.startSlot;
          runEnd = b.endSlot;
        }
      }
      pushRun();
    }
  }
  return out;
}

// ---------- Para daily max minutes ----------
function paraDailyMaxWarnings({ schedule, roster, appSettings }: Context): Warning[] {
  const byDay = blocksByDay(schedule, appSettings.activeDays);
  const byId = settingsById(roster.settings);
  const slotMin = appSettings.slotMinutes;
  const out: Warning[] = [];
  for (const para of roster.paras) {
    for (const day of appSettings.activeDays) {
      const worked = byDay[day]
        .filter((b) => b.paraIds.includes(para.id))
        .filter((b) => byId.get(b.settingId)?.kind !== "lunch")
        .reduce((sum, b) => sum + blockDurationMin(b.startSlot, b.endSlot, slotMin), 0);
      if (worked > para.maxDailyMin) {
        out.push({
          kind: "para-daily-max",
          id: `pdm_${para.id}_${day}`,
          severity: "warn",
          paraId: para.id,
          day,
          workedMin: worked,
          limit: para.maxDailyMin,
          message: `${para.name}: ${worked} worked min on ${day} (limit ${para.maxDailyMin})`,
        });
      }
    }
  }
  return out;
}

// ---------- Para transitions ----------
function paraTransitionWarnings({ schedule, roster, appSettings }: Context): Warning[] {
  const byDay = blocksByDay(schedule, appSettings.activeDays);
  const out: Warning[] = [];
  for (const para of roster.paras) {
    for (const day of appSettings.activeDays) {
      const mine = byDay[day].filter((b) => b.paraIds.includes(para.id));
      let t = 0;
      for (let i = 1; i < mine.length; i++) {
        if (mine[i].settingId !== mine[i - 1].settingId) t++;
      }
      if (t > para.transitionThreshold) {
        out.push({
          kind: "para-transitions",
          id: `ptr_${para.id}_${day}`,
          severity: "warn",
          paraId: para.id,
          day,
          count: t,
          threshold: para.transitionThreshold,
          message: `${para.name}: ${t} transitions on ${day} (threshold ${para.transitionThreshold})`,
        });
      }
    }
  }
  return out;
}

// ---------- Provider (OT/Speech) double-booked ----------
function providerConflictWarnings({ schedule, roster, appSettings }: Context): Warning[] {
  const byDay = blocksByDay(schedule, appSettings.activeDays);
  const byId = settingsById(roster.settings);
  const out: Warning[] = [];
  for (const providerId of roster.providers) {
    for (const day of appSettings.activeDays) {
      const mine = byDay[day].filter(
        (b) =>
          b.providerId === providerId &&
          ["ot", "speech"].includes(byId.get(b.settingId)?.kind ?? "")
      );
      for (let i = 0; i < mine.length; i++) {
        for (let j = i + 1; j < mine.length; j++) {
          if (overlapSlots(mine[i], mine[j]) > 0) {
            out.push({
              kind: "provider-conflict",
              id: `pc_${providerId}_${day}_${mine[i].id}_${mine[j].id}`,
              severity: "error",
              providerId,
              day,
              blockIds: [mine[i].id, mine[j].id],
              message: `Provider ${providerId} double-booked on ${day}`,
            });
          }
        }
      }
    }
  }
  return out;
}

// Exports for selectors in the UI.
export function computeStudentMinuteTotals(
  schedule: ScheduleData,
  student: Student,
  settings: Setting[],
  slotMin: number
): { genEd: number; sped: number; ot: number; speech: number } {
  const byId = new Map(settings.map((s) => [s.id, s]));
  const totals = { genEd: 0, sped: 0, ot: 0, speech: 0 };
  for (const b of Object.values(schedule.blocks)) {
    if (!b.studentIds.includes(student.id)) continue;
    const s = byId.get(b.settingId);
    if (!s) continue;
    const d = blockDurationMin(b.startSlot, b.endSlot, slotMin);
    if (s.kind === "gen-ed") totals.genEd += d;
    else if (s.kind === "sped") totals.sped += d;
    else if (s.kind === "ot") totals.ot += d;
    else if (s.kind === "speech") totals.speech += d;
  }
  return totals;
}

export function computeParaDayTotals(
  schedule: ScheduleData,
  para: Para,
  day: DayOfWeek,
  settings: Setting[],
  slotMin: number
): { workedMin: number; lunchMin: number; transitions: number } {
  const byId = new Map(settings.map((s) => [s.id, s]));
  const mine = Object.values(schedule.blocks)
    .filter((b) => b.day === day && b.paraIds.includes(para.id))
    .sort((a, b) => a.startSlot - b.startSlot);
  let worked = 0;
  let lunch = 0;
  let transitions = 0;
  for (let i = 0; i < mine.length; i++) {
    const b = mine[i];
    const kind = byId.get(b.settingId)?.kind;
    const d = blockDurationMin(b.startSlot, b.endSlot, slotMin);
    if (kind === "lunch") lunch += d;
    else worked += d;
    if (i > 0 && mine[i].settingId !== mine[i - 1].settingId) transitions++;
  }
  return { workedMin: worked, lunchMin: lunch, transitions };
}
