import { readPublicEnv } from "@/lib/env";

/**
 * ICAS 2026 ends for public participation at this instant (IST).
 * After this: signup/signin stay open; event registration closes; home shows ended + recordings.
 * - `NEXT_PUBLIC_EVENT_ENDED=true` → force ended
 * - `NEXT_PUBLIC_EVENT_ENDED=false` → force open
 * - unset → ended at/after 21 Aug 2026 16:00 IST
 */
export const EVENT_PUBLIC_ENDS_AT = new Date("2026-08-21T16:00:00+05:30");
export const EVENT_PUBLIC_ENDS_LABEL = "21 August 2026 at 4:00 PM";

export function isEventPubliclyEnded(now = new Date()): boolean {
  const override = readPublicEnv("NEXT_PUBLIC_EVENT_ENDED");
  if (override === "true") return true;
  if (override === "false") return false;
  return now.getTime() >= EVENT_PUBLIC_ENDS_AT.getTime();
}

/** Self-service `/event-register` is closed once the public event window has ended. */
export function isEventRegistrationClosed(now = new Date()): boolean {
  return isEventPubliclyEnded(now);
}
