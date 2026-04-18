import type { CellStyle, SessionType } from "../types";

export const sessionColor: Record<SessionType, string> = {
  reading: "bg-blue-200 text-slate-900",
  writing: "bg-purple-200 text-slate-900",
  math: "bg-rose-200 text-slate-900",
  sel: "bg-yellow-100 text-slate-900",
  transition: "bg-violet-100 text-slate-900",
  para: "bg-green-200 text-slate-900",
  independent: "bg-white text-slate-900",
};

export const sessionSwatch: Record<SessionType, string> = {
  reading: "bg-blue-200",
  writing: "bg-purple-200",
  math: "bg-rose-200",
  sel: "bg-yellow-100",
  transition: "bg-violet-100",
  para: "bg-green-200",
  independent: "bg-white border border-slate-300",
};

export const cellStyleClass: Record<CellStyle, string> = {
  normal: "bg-white",
  pullout: "bg-orange-300",
  unavailable: "bg-slate-300",
};
