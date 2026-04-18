import type {
  DayCell,
  DayKey,
  SessionRow,
  SessionType,
  TimeBlock,
  WeeklyPlan,
} from "../types";

export const TIME_SLOTS = [
  "8:30–9:00",
  "9:00–9:30",
  "9:30–10:00",
  "10:00–10:30",
  "10:30–11:00",
  "11:00–11:30",
  "11:30–12:00",
  "12:00–12:30",
  "12:30–1:00",
  "1:00–1:30",
  "1:30–2:00",
  "2:00–2:30",
  "2:30–3:00",
  "3:00–3:30",
];

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyDays(): Record<DayKey, DayCell> {
  return {
    mon: { text: "", style: "normal" },
    tue: { text: "", style: "normal" },
    wed: { text: "", style: "normal" },
    thu: { text: "", style: "normal" },
    fri: { text: "", style: "normal" },
  };
}

function makeRow(name: string, type: SessionType): SessionRow {
  return {
    id: uid(),
    name,
    type,
    status: "",
    days: emptyDays(),
    materials: "",
    notes: "",
  };
}

function makeBlock(time: string, rows: SessionRow[]): TimeBlock {
  return { id: uid(), time, rows };
}

function cell(text: string, style: DayCell["style"] = "normal"): DayCell {
  return { text, style };
}

export function buildDefaultPlan(weekOf: string): WeeklyPlan {
  const now = new Date().toISOString();

  const rounds = makeRow("Rounds / Check-Ins", "independent");
  rounds.materials = "iPad";
  rounds.days = {
    mon: cell("Rounds"),
    tue: cell("PLC"),
    wed: cell("Will & Wyatt Late\nRounds"),
    thu: cell("Rounds"),
    fri: cell("Rounds"),
  };

  const maggieReading = makeRow("Maggie Reading", "reading");
  const dylanArrives = makeRow("Dylan Arrives 9:15", "transition");

  const dylanReading = makeRow("Dylan Reading (9:25–9:50)", "reading");
  const maggieInd = makeRow("Maggie Ind. or Para", "para");

  const dalilahMath1 = makeRow("Dalilah Math", "math");
  const dylanIready1 = makeRow("Dylan iReady/Speech/OT, etc.", "independent");
  dylanIready1.days = {
    mon: cell("Dylan Speech", "pullout"),
    tue: cell("My Path"),
    wed: cell("Dylan OT", "pullout"),
    thu: cell("Dylan Speech", "pullout"),
    fri: cell("Dylan OT", "pullout"),
  };
  const maggieIready1 = makeRow("Maggie iReady/Speech/OT, etc.", "independent");
  maggieIready1.days = {
    mon: cell("Maggie Speech", "pullout"),
    tue: cell("My Path/Snack"),
    wed: cell("", "unavailable"),
    thu: cell("", "unavailable"),
    fri: cell("", "unavailable"),
  };

  const dalilahReading = makeRow("Dalilah Reading", "reading");
  const dylanIready2 = makeRow("Dylan iReady/Speech/OT, etc.", "independent");
  dylanIready2.days = {
    mon: cell("My Path"),
    tue: cell("Math Bin with Para"),
    wed: cell("My Path"),
    thu: cell("My Path"),
    fri: cell("Dylan OT", "pullout"),
  };
  const maggieIready2 = makeRow("Maggie iReady/Speech/OT, etc.", "independent");
  maggieIready2.days = {
    mon: cell("Math Bin with Para"),
    tue: cell("Math Bin with Para"),
    wed: cell("Math Bin with Para"),
    thu: cell("", "unavailable"),
    fri: cell("Maggie Speech", "pullout"),
  };
  const wyattJJ = makeRow("Wyatt and JJ", "independent");
  wyattJJ.days = {
    mon: cell("Floor Time"),
    tue: cell("Floor Time"),
    wed: cell("Wyatt OT", "pullout"),
    thu: cell("Wyatt OT", "pullout"),
    fri: cell("Will OT", "pullout"),
  };

  const gr2Math = makeRow("2nd Gr Math Group or Amplify", "math");
  gr2Math.days = { ...emptyDays(), mon: cell("iReady") };
  const k1Reading = makeRow("K/1 Reading Group", "reading");

  const sharedReading = makeRow("Shared Reading", "reading");
  const jjAidenSpeech = makeRow("", "independent");
  jjAidenSpeech.days = {
    mon: cell("JJ Speech", "pullout"),
    tue: cell("", "unavailable"),
    wed: cell("Aiden Speech", "pullout"),
    thu: cell("JJ Speech", "pullout"),
    fri: cell("Aiden Speech", "pullout"),
  };

  const k1Sel = makeRow("K/1 SEL", "sel");

  const kinderMath = makeRow("Kinder Math", "math");

  const readingComp = makeRow("Reading Comp", "reading");
  const willWyatt = makeRow("Will / Wyatt", "independent");
  willWyatt.days = {
    mon: cell("Will/Wyatt Speech", "pullout"),
    tue: cell("", "unavailable"),
    wed: cell("", "unavailable"),
    thu: cell("Will/Wyatt Speech", "pullout"),
    fri: cell("Will OT", "pullout"),
  };

  const muhammadReading = makeRow("Muhammad Reading", "reading");
  muhammadReading.days = {
    ...emptyDays(),
    wed: cell("Muhammad Speech", "pullout"),
  };

  const writingGroup = makeRow("Writing Group", "writing");
  const muhammadMath = makeRow("Muhammad Math", "math");
  muhammadMath.days = { ...emptyDays(), thu: cell("JJ OT", "pullout") };

  const wyattJJLate = makeRow("Wyatt, JJ", "para");

  const timeBlocks: TimeBlock[] = [
    makeBlock("8:30–9:00", [rounds]),
    makeBlock("9:00–9:30", [maggieReading, dylanArrives]),
    makeBlock("9:30–10:00", [dylanReading, maggieInd]),
    makeBlock("10:00–10:30", [dalilahMath1, dylanIready1, maggieIready1]),
    makeBlock("10:30–11:00", [dalilahReading, dylanIready2, maggieIready2, wyattJJ]),
    makeBlock("11:00–11:30", [gr2Math]),
    makeBlock("11:30–12:00", [k1Reading]),
    makeBlock("12:00–12:30", [sharedReading, jjAidenSpeech]),
    makeBlock("12:30–1:00", [k1Sel]),
    makeBlock("1:00–1:30", [kinderMath]),
    makeBlock("1:30–2:00", [readingComp, willWyatt]),
    makeBlock("2:00–2:30", [muhammadReading]),
    makeBlock("2:30–3:00", [writingGroup, muhammadMath]),
    makeBlock("3:00–3:30", [wyattJJLate]),
  ];

  return {
    id: uid(),
    weekOf,
    timeBlocks,
    createdAt: now,
    updatedAt: now,
  };
}

export function buildBlankPlan(weekOf: string): WeeklyPlan {
  const now = new Date().toISOString();
  return {
    id: uid(),
    weekOf,
    timeBlocks: TIME_SLOTS.map((t) =>
      makeBlock(t, [makeRow("", "independent")]),
    ),
    createdAt: now,
    updatedAt: now,
  };
}
