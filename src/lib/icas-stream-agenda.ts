/** ICAS 2026 agenda for the streaming page (19–21 Aug). Source: ICAS-2026_Agenda.pdf */

export type IcasStreamAgendaDay = "2026-08-19" | "2026-08-20" | "2026-08-21";

export interface IcasStreamAgendaItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  speaker?: string;
  /** Tea, lunch, registration, etc. — rendered with muted styling. */
  isBreak?: boolean;
}

export const ICAS_STREAM_AGENDA_DAYS: { date: IcasStreamAgendaDay; label: string }[] = [
  { date: "2026-08-19", label: "19 Aug" },
  { date: "2026-08-20", label: "20 Aug" },
  { date: "2026-08-21", label: "21 Aug" },
];

export const ICAS_STREAM_AGENDA: Record<IcasStreamAgendaDay, IcasStreamAgendaItem[]> = {
  "2026-08-19": [
    {
      id: "d1-registration",
      title: "Registration",
      startTime: "08:30:00",
      endTime: "09:15:00",
      isBreak: true,
    },
    {
      id: "d1-modelling",
      title:
        "Use of air quality modelling tools for local to regional scale air quality management",
      startTime: "09:15:00",
      endTime: "11:15:00",
      speaker: "Facilitators: CSTEP and Indian Institute of Technology (IIT) Bombay",
    },
    {
      id: "d1-tea-1",
      title: "Tea break",
      startTime: "11:15:00",
      endTime: "11:30:00",
      isBreak: true,
    },
    {
      id: "d1-law",
      title: "Air quality law and policy landscape in India",
      startTime: "11:30:00",
      endTime: "13:30:00",
      speaker:
        "Trainer: Prof. Sairam Bhatt (National Law School of India University); Facilitators: Ms Swagata Dey & Ms Sheetal Manokar (CSTEP)",
    },
    {
      id: "d1-lunch",
      title: "Lunch",
      startTime: "13:30:00",
      endTime: "14:15:00",
      isBreak: true,
    },
    {
      id: "d1-acsm",
      title:
        "Advanced Aerosol Chemical Speciation Monitor (ACSM) data analysis: QA/QC with the ACSM toolkit and wind/trajectory analysis using ZeFir from ACTRIS",
      startTime: "14:15:00",
      endTime: "16:15:00",
      speaker:
        "Trainer: Dr Laura-Helena Rivellini (CEA, France); Facilitator: Dr Kumar Sarang (CSTEP)",
    },
    {
      id: "d1-tea-2",
      title: "Tea break",
      startTime: "16:15:00",
      endTime: "16:45:00",
      isBreak: true,
    },
    {
      id: "d1-networking",
      title: "Break for networking and venue preparation (poster set-up and viewing time)",
      startTime: "16:45:00",
      endTime: "18:30:00",
      isBreak: true,
    },
    {
      id: "d1-inaugural",
      title: "Inaugural session",
      startTime: "18:30:00",
      endTime: "19:15:00",
      speaker:
        "Dr Shirish Sinha (Clean Air Fund); Dr Prashant Gargava (NGT); Ms Reena Gupta (Punjab Pollution Control Board, Invited)",
    },
    {
      id: "d1-reports",
      title: "Launch of reports and presentations",
      startTime: "19:15:00",
      endTime: "20:15:00",
    },
    {
      id: "d1-dinner",
      title: "Dinner",
      startTime: "20:15:00",
      endTime: "21:30:00",
      isBreak: true,
    },
  ],
  "2026-08-20": [
    {
      id: "d2-welcome",
      title: "Welcome address: Introduction to ICAS 2026 and CSTEP Air Quality Sector",
      startTime: "09:30:00",
      endTime: "09:45:00",
      speaker: "Dr Prakash Doraiswamy",
    },
    {
      id: "d2-keynote",
      title: "Keynote address(es)",
      startTime: "09:45:00",
      endTime: "10:30:00",
      speaker: "Dr Santosh Harish",
    },
    {
      id: "d2-regional",
      title: "Moving beyond cities: Air quality management at the regional level (panel discussion)",
      startTime: "10:30:00",
      endTime: "11:45:00",
      speaker: "Moderator: Dr Piyush Bhardwaj",
    },
    {
      id: "d2-tea-1",
      title: "Tea break",
      startTime: "11:45:00",
      endTime: "12:00:00",
      isBreak: true,
    },
    {
      id: "d2-inventory",
      title: "National emission inventory: Bedrock for policy and mitigation measures (presentation-led discussion)",
      startTime: "12:00:00",
      endTime: "13:15:00",
      speaker: "Moderator: Mr Anirban Banerjee",
    },
    {
      id: "d2-lunch",
      title: "Lunch",
      startTime: "13:15:00",
      endTime: "14:15:00",
      isBreak: true,
    },
    {
      id: "d2-safair",
      title: "Namma SAFAIR tool demonstration",
      startTime: "14:15:00",
      endTime: "14:30:00",
      speaker: "Ms Ramya Natarajan",
    },
    {
      id: "d2-msme",
      title: "Cleaning up industrial emissions: Mitigation measures for MSMEs and markets (presentation-led discussion)",
      startTime: "14:30:00",
      endTime: "15:30:00",
      speaker: "Moderator: Ms Shivani Sharma",
    },
    {
      id: "d2-techo",
      title: "Techno-economic assessment methods to prioritise air quality interventions (presentation-led discussion)",
      startTime: "15:30:00",
      endTime: "16:45:00",
      speaker: "Moderator: Ms Tanushree Ganguly",
    },
    {
      id: "d2-tea-2",
      title: "Tea break",
      startTime: "16:45:00",
      endTime: "17:00:00",
      isBreak: true,
    },
    {
      id: "d2-airlab",
      title: "Concluding the AIRLAB Microsensors Challenge",
      startTime: "17:00:00",
      endTime: "18:30:00",
      speaker: "Moderators: Dr Kumar Sarang & Dr Abhsihek Penchala",
    },
  ],
  "2026-08-21": [
    {
      id: "d3-keynote",
      title: "Keynote address",
      startTime: "09:30:00",
      endTime: "10:00:00",
      speaker: "Dr Rathish Menon; Prof. S N Tripathi",
    },
    {
      id: "d3-plenary",
      title: "Plenary session: Perspectives from corporate leaders on air pollution mitigation (panel discussion)",
      startTime: "10:00:00",
      endTime: "11:00:00",
      speaker: "Moderator: Dr Jai Asundi",
    },
    {
      id: "d3-punjab",
      title: "Launch of the report ‘Pathways for Clean Transportation in Punjab’",
      startTime: "11:00:00",
      endTime: "11:30:00",
    },
    {
      id: "d3-tea",
      title: "Tea break",
      startTime: "11:30:00",
      endTime: "11:45:00",
      isBreak: true,
    },
    {
      id: "d3-cities",
      title: "Air quality management in cities: Unique challenges and opportunities (presentation-led discussion)",
      startTime: "11:45:00",
      endTime: "13:00:00",
      speaker: "Moderator: Dr Nirav Lekinwala",
    },
    {
      id: "d3-lunch",
      title: "Lunch",
      startTime: "13:15:00",
      endTime: "14:15:00",
      isBreak: true,
    },
    {
      id: "d3-accountability",
      title: "Towards an accountability framework: Assessing the efficacy of policies (jointly hosted with HEI)",
      startTime: "14:15:00",
      endTime: "15:30:00",
      speaker: "Moderators: Dr Abinaya Sekar & Ms Swagata Dey",
    },
    {
      id: "d3-community",
      title: "From grassroots to governance: Community participation for clean air (panel discussion)",
      startTime: "15:30:00",
      endTime: "16:30:00",
      speaker: "Moderator: Ms Nidhi Jamwal",
    },
    {
      id: "d3-close",
      title: "Vote of thanks and group photograph",
      startTime: "16:30:00",
      endTime: "16:45:00",
      isBreak: true,
    },
  ],
};

export function getIcasStreamAgendaForDay(date: IcasStreamAgendaDay): IcasStreamAgendaItem[] {
  return ICAS_STREAM_AGENDA[date] ?? [];
}
