import type { z } from "zod";

/** Today's date as YYYY-MM-DD in the local timezone (for `<input type="date" min>`). */
export function getTodayDateInputMin(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDateBeforeToday(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  return dateStr < getTodayDateInputMin();
}

export function refineDateNotInPast(
  dateStr: string | undefined,
  ctx: z.RefinementCtx,
  path: string,
  fieldLabel = "Date",
): void {
  if (!dateStr?.trim()) return;

  if (isDateBeforeToday(dateStr.trim())) {
    ctx.addIssue({
      code: "custom",
      message: `${fieldLabel} cannot be in the past`,
      path: [path],
    });
  }
}
