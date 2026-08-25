export function parseDecimalInput(raw: string): { text: string; value: number | null } {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  const text =
    firstDot === -1
      ? cleaned
      : `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, "")}`;
  if (text === "" || text === ".") return { text, value: null };
  const value = Number(text);
  if (!Number.isFinite(value)) return { text, value: null };
  return { text, value };
}

export function isDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localIsoDate(date) === value;
}

export function localIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function shiftDayKey(from: string, days: number): string {
  const date = new Date(`${from}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localIsoDate(date);
}
