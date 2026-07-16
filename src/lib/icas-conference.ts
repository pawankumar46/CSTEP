export const ICAS_CONFERENCE = {
  name: "India Clean Air Summit (ICAS) 2026",
  shortName: "ICAS 2026",
  theme: "Air Without Borders: Scaling Air Quality Action Across Cities, States, and Regions",
  datesLabel: "19 Aug 2026 – 21 Aug 2026",
  eventStartIso: "2026-08-19T05:30:00+05:30",
  venue: "Four Seasons Hotel Bengaluru",
  sourceUrl: "https://cstep.in/events/india-clean-air-summit-icas-2026/",
  intro:
    "The Center for Study of Science, Technology and Policy (CSTEP) is pleased to announce the eighth edition of its flagship event, India Clean Air Summit (ICAS) 2026.",
  aboutParagraphs: [
    "ICAS brings together researchers, policymakers, practitioners, and academics to shape the narrative on air pollution and set a collective vision for forward-looking initiatives and priorities.",
    "ICAS 2026 focuses on airshed-based solutions to address the scale of air pollution challenges. It explores why a regional air quality management approach matters, and how measurement and modelling data can inform policies and interventions tailored to multiple scales—beyond city or state borders.",
  ],
  highlights: [
    {
      title: "Regional-action stream",
      description:
        "A dedicated track focused on airshed-based management and implementation.",
    },
    {
      title: "Cross-scale solutions",
      description:
        "Linking neighbourhoods, cities, and regions through coordinated air quality action.",
    },
    {
      title: "Report launches",
      description:
        "Regional policy and governance for inter-state coordination, management, and financing.",
    },
    {
      title: "Airshed modelling & data tools",
      description:
        "Demonstrations of simplified tools designed for decision-makers and practitioners.",
    },
    {
      title: "Trainings",
      description: "Hands-on sessions for students and practitioners.",
    },
  ],
  contact: {
    name: "Arundati Ganesh, Consultant, Air Quality",
    email: "icas@cstep.in",
  },
} as const;

export function isIcasEventName(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.includes("icas") || normalized.includes("clean air summit");
}

/** Training day on 19 Aug — hidden from self-registration only; lobby/admin flows keep all days. */
export const ICAS_SELF_REGISTRATION_EXCLUDED_DATES = new Set(["2026-08-19"]);

/** Self-registration (`/event-register`) only — do not use in lobby/admin dialogs. */
export function filterEventDaysForSelfRegistration<T extends { date: string }>(
  days: T[],
  eventName?: string | null,
): T[] {
  if (!eventName || !isIcasEventName(eventName)) return days;
  return days.filter((day) => !ICAS_SELF_REGISTRATION_EXCLUDED_DATES.has(day.date));
}

export function sortEventDaysByDate<T extends { date: string }>(days: T[]): T[] {
  return [...days].sort((a, b) => a.date.localeCompare(b.date));
}

export function getConferenceVenue(eventName?: string | null, apiLocation?: string | null): string {
  if (eventName && isIcasEventName(eventName)) {
    return ICAS_CONFERENCE.venue;
  }

  const location = apiLocation?.trim();
  if (location && !/^(hybrid|virtual|physical)$/i.test(location)) {
    return location;
  }

  return ICAS_CONFERENCE.venue;
}
