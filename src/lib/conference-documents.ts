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
    description: "Updated tentative schedule for 19–21 August 2026.",
    href: "/docs/icas-agenda.pdf",
  },
];
