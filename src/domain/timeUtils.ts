// Minute-of-day helpers. All times are integers in [0, 1440).

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

export function fromMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatTime12(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function slotToMinutes(
  slotIndex: number,
  dayStart: number,
  slotMinutes: number
): number {
  return dayStart + slotIndex * slotMinutes;
}

export function minutesToSlot(
  minutes: number,
  dayStart: number,
  slotMinutes: number
): number {
  return Math.floor((minutes - dayStart) / slotMinutes);
}

export function slotCount(
  dayStart: number,
  dayEnd: number,
  slotMinutes: number
): number {
  return Math.ceil((dayEnd - dayStart) / slotMinutes);
}

export function blockDurationMin(
  startSlot: number,
  endSlot: number,
  slotMinutes: number
): number {
  return (endSlot - startSlot) * slotMinutes;
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
