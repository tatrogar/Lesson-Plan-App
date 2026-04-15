import { describe, it, expect } from "vitest";
import { computeWarnings } from "./warnings";
import type {
  AppSettings,
  Block,
  Para,
  Roster,
  ScheduleData,
  Student,
} from "./types";
import { DEFAULT_SETTINGS } from "./constants";

const app: AppSettings = {
  dayStart: 8 * 60,
  dayEnd: 15 * 60 + 30,
  slotMinutes: 15,
  activeDays: ["Mon"],
};

function student(id: string, overrides: Partial<Student> = {}): Student {
  return {
    id,
    name: id,
    grade: "3",
    iep: { genEdMinutesWeek: 0, spedMinutesWeek: 0, otMinutesWeek: 0, speechMinutesWeek: 0 },
    supportLevel: "small-group",
    transitionThreshold: 4,
    ...overrides,
  };
}

function para(id: string, overrides: Partial<Para> = {}): Para {
  return {
    id,
    name: id,
    shiftStart: 8 * 60,
    shiftEnd: 15 * 60 + 30,
    lunch: { lengthMin: 30, windowStart: 11 * 60, windowEnd: 13 * 60 },
    maxConsecutiveMin: 180,
    maxDailyMin: 390,
    transitionThreshold: 5,
    ...overrides,
  };
}

function roster(overrides: Partial<Roster> = {}): Roster {
  return {
    students: [],
    paras: [],
    settings: DEFAULT_SETTINGS,
    providers: [],
    ...overrides,
  };
}

function block(id: string, patch: Partial<Block> = {}): Block {
  return {
    id,
    day: "Mon",
    startSlot: 0,
    endSlot: 4,
    settingId: "set_gen_ed",
    studentIds: [],
    paraIds: [],
    ...patch,
  };
}

function schedule(blocks: Block[]): ScheduleData {
  return { blocks: Object.fromEntries(blocks.map((b) => [b.id, b])) };
}

describe("warning engine: student minutes", () => {
  it("flags short sped minutes against target", () => {
    const stu = student("s1", {
      iep: { genEdMinutesWeek: 0, spedMinutesWeek: 120, otMinutesWeek: 0, speechMinutesWeek: 0 },
    });
    const r = roster({ students: [stu] });
    const s = schedule([
      block("b1", {
        settingId: "set_sped",
        startSlot: 0,
        endSlot: 4, // 60 min
        studentIds: ["s1"],
      }),
    ]);
    const warnings = computeWarnings(s, r, app);
    const w = warnings.find((x) => x.kind === "student-minutes");
    expect(w).toBeDefined();
    expect(w!.severity).toBe("error");
    if (w!.kind === "student-minutes") {
      expect(w!.deltaMin).toBe(-60);
      expect(w!.actualMin).toBe(60);
      expect(w!.targetMin).toBe(120);
    }
  });

  it("does not flag when targets are met exactly", () => {
    const stu = student("s1", {
      iep: { genEdMinutesWeek: 60, spedMinutesWeek: 0, otMinutesWeek: 0, speechMinutesWeek: 0 },
    });
    const r = roster({ students: [stu] });
    const s = schedule([
      block("b1", { settingId: "set_gen_ed", startSlot: 0, endSlot: 4, studentIds: ["s1"] }),
    ]);
    const warnings = computeWarnings(s, r, app);
    expect(warnings.filter((x) => x.kind === "student-minutes")).toHaveLength(0);
  });
});

describe("warning engine: para lunch", () => {
  it("flags a para with no qualifying lunch", () => {
    const p = para("p1");
    const r = roster({ paras: [p] });
    const s = schedule([
      block("b1", { paraIds: ["p1"], startSlot: 0, endSlot: 4, settingId: "set_gen_ed" }),
    ]);
    const warnings = computeWarnings(s, r, app);
    expect(warnings.find((x) => x.kind === "para-lunch")).toBeDefined();
  });

  it("passes when a 30-min lunch lands in the window", () => {
    // 11:30-12:00 in slots: dayStart=480, so slot = (690-480)/15 = 14 .. 16
    const p = para("p1");
    const r = roster({ paras: [p] });
    const s = schedule([
      block("b1", { paraIds: ["p1"], startSlot: 0, endSlot: 4, settingId: "set_gen_ed" }),
      block("b2", { paraIds: ["p1"], startSlot: 14, endSlot: 16, settingId: "set_lunch" }),
    ]);
    const warnings = computeWarnings(s, r, app);
    expect(warnings.find((x) => x.kind === "para-lunch")).toBeUndefined();
  });
});

describe("warning engine: provider conflicts", () => {
  it("flags overlapping OT blocks for the same provider", () => {
    const r = roster({ providers: ["OT: Chen"] });
    const s = schedule([
      block("b1", { settingId: "set_ot", providerId: "OT: Chen", startSlot: 4, endSlot: 8 }),
      block("b2", { settingId: "set_ot", providerId: "OT: Chen", startSlot: 6, endSlot: 10 }),
    ]);
    const warnings = computeWarnings(s, r, app);
    expect(warnings.find((x) => x.kind === "provider-conflict")).toBeDefined();
  });
});

describe("warning engine: student double-book and support", () => {
  it("flags student double-booked at same time", () => {
    const stu = student("s1");
    const r = roster({ students: [stu] });
    const s = schedule([
      block("b1", { startSlot: 0, endSlot: 4, studentIds: ["s1"], settingId: "set_gen_ed" }),
      block("b2", { startSlot: 2, endSlot: 6, studentIds: ["s1"], settingId: "set_sped" }),
    ]);
    const warnings = computeWarnings(s, r, app);
    expect(warnings.find((x) => x.kind === "student-double-booked")).toBeDefined();
  });

  it("flags 1:1 student with no para", () => {
    const stu = student("s1", { supportLevel: "1:1" });
    const r = roster({ students: [stu] });
    const s = schedule([
      block("b1", { startSlot: 0, endSlot: 4, studentIds: ["s1"], settingId: "set_gen_ed" }),
    ]);
    const warnings = computeWarnings(s, r, app);
    expect(warnings.find((x) => x.kind === "student-support")).toBeDefined();
  });
});

describe("warning engine: para consecutive + transitions", () => {
  it("flags consecutive working minutes over limit", () => {
    const p = para("p1", { maxConsecutiveMin: 60 });
    const r = roster({ paras: [p] });
    // Two adjacent 60-min blocks => 120 min consecutive, limit 60.
    const s = schedule([
      block("b1", { paraIds: ["p1"], startSlot: 0, endSlot: 4, settingId: "set_gen_ed" }),
      block("b2", { paraIds: ["p1"], startSlot: 4, endSlot: 8, settingId: "set_sped" }),
      // Qualifying lunch to avoid the lunch warning dominating.
      block("b3", { paraIds: ["p1"], startSlot: 14, endSlot: 16, settingId: "set_lunch" }),
    ]);
    const warnings = computeWarnings(s, r, app);
    const w = warnings.find((x) => x.kind === "para-consecutive");
    expect(w).toBeDefined();
    if (w && w.kind === "para-consecutive") {
      expect(w.consecutiveMin).toBe(120);
    }
  });

  it("flags para transitions over threshold", () => {
    const p = para("p1", { transitionThreshold: 1 });
    const r = roster({ paras: [p] });
    const s = schedule([
      block("b1", { paraIds: ["p1"], startSlot: 0, endSlot: 2, settingId: "set_gen_ed" }),
      block("b2", { paraIds: ["p1"], startSlot: 2, endSlot: 4, settingId: "set_sped" }),
      block("b3", { paraIds: ["p1"], startSlot: 4, endSlot: 6, settingId: "set_gen_ed" }),
      block("b4", { paraIds: ["p1"], startSlot: 14, endSlot: 16, settingId: "set_lunch" }),
    ]);
    const warnings = computeWarnings(s, r, app);
    expect(warnings.find((x) => x.kind === "para-transitions")).toBeDefined();
  });
});
