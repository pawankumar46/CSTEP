export interface ConferenceDocument {
  id: string;
  title: string;
  description: string;
  href: string;
}

export const CONFERENCE_DOCUMENTS: ConferenceDocument[] = [
  {
    id: "concept-note",
    title: "Concept Note",
    description: "Overview and objectives of ICAS 2026.",
    href: "/docs/icas-2026-concept-note.pdf",
  },
  {
    id: "event-agenda",
    title: "Event Agenda",
    description: "Schedule and sessions for the conference.",
    href: "/docs/icas-agenda.pdf",
  },
];
