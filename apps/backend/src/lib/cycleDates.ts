export function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function nextOrSameWeekday(date: Date, targetDayOfWeek: number): Date {
  const d = startOfDay(date);
  const diff = (targetDayOfWeek - d.getDay() + 7) % 7;
  return addDays(d, diff);
}

export interface CycleDateWindow {
  label: string;
  orderWindowOpensAt: Date;
  orderWindowClosesAt: Date;
  deliveryDate: Date;
}

/**
 * Suggests dates for the next cycle. When a previous cycle exists, shifts its
 * window forward by exactly 7 days (preserving any holiday-adjusted gaps
 * between open/close/delivery). Otherwise falls back to the standard
 * Saturday-open / Monday-close / Wednesday-deliver pattern from today.
 */
export function suggestNextCycleDates(
  lastCycle: { orderWindowOpensAt: Date; orderWindowClosesAt: Date; deliveryDate: Date } | null,
  now: Date = new Date(),
): CycleDateWindow {
  let orderWindowOpensAt: Date;
  let orderWindowClosesAt: Date;
  let deliveryDate: Date;

  if (lastCycle) {
    orderWindowOpensAt = addDays(lastCycle.orderWindowOpensAt, 7);
    orderWindowClosesAt = addDays(lastCycle.orderWindowClosesAt, 7);
    deliveryDate = addDays(lastCycle.deliveryDate, 7);
  } else {
    orderWindowOpensAt = nextOrSameWeekday(now, 6); // Saturday
    orderWindowClosesAt = addDays(orderWindowOpensAt, 2); // Monday
    deliveryDate = addDays(orderWindowClosesAt, 2); // Wednesday
  }

  return {
    label: isoWeekLabel(orderWindowOpensAt),
    orderWindowOpensAt,
    orderWindowClosesAt,
    deliveryDate,
  };
}
