export function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Suggests the date to promise customers when ordering will reopen, shown
 * while the baker fills in "Close Ordering". Always anchored to `now` so it
 * can never land in the past, regardless of how old the last cycle is.
 */
export function suggestNextCycleStartDate(now: Date = new Date()): Date {
  return addDays(now, 5);
}

export interface CycleStartSuggestion {
  label: string;
  deliveryDate: Date;
}

/**
 * Suggests the label and delivery date for a cycle starting right now (the
 * order window always opens at the moment "Start Next Cycle" is clicked, not
 * on some previously-promised date, so this never needs a "last cycle" input).
 */
export function suggestCycleStart(now: Date = new Date()): CycleStartSuggestion {
  return {
    label: isoWeekLabel(now),
    deliveryDate: addDays(now, 5),
  };
}
