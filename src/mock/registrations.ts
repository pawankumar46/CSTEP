import type {
  Registration,
  RegistrationStatus,
  AttendanceMode,
  ParticipationDate,
  ParticipationTime,
  TravelType,
} from "@/types";
import {
  ATTENDANCE_MODE_VALUES,
  PARTICIPATION_DATE_VALUES,
  FOOD_PREFERENCE_VALUES,
  MEDICAL_SUPPORT_VALUES,
  TRANSLATION_LANGUAGE_VALUES,
} from "@/lib/registration-options";
import { mockUsers } from "./users";
import { mockEvents } from "./events";

const TRAVEL_TYPES: TravelType[] = ["flight_taxi_hotel", "taxi_hotel", "hotel_only", "taxi_only", "flight_only", "train_only"];
const STATUSES: RegistrationStatus[] = ["pending", "accepted", "rejected", "on_hold"];

function generateRegistrations(): Registration[] {
  const registrations: Registration[] = [];
  const baseUsers = mockUsers.filter((u) => u.role === "base_user" || u.id.startsWith("user-0"));

  for (let i = 0; i < 120; i++) {
    const user = baseUsers[i % baseUsers.length];
    const event = mockEvents[i % mockEvents.length];
    const travelRequired = i % 4 === 0;
    const medicalRequired = i % 8 === 0;
    const translationRequired = i % 6 === 0;
    const status = STATUSES[i % STATUSES.length];

    registrations.push({
      id: `reg-${String(i + 1).padStart(3, "0")}`,
      userId: user.id,
      eventId: event.id,
      userName: `${user.salutation || ""} ${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phone,
      participationDate: PARTICIPATION_DATE_VALUES[i % PARTICIPATION_DATE_VALUES.length] as ParticipationDate,
      participationTime: (i % 3 === 0 ? "full_day" : "half_day") as ParticipationTime,
      attendanceMode: ATTENDANCE_MODE_VALUES[i % ATTENDANCE_MODE_VALUES.length] as AttendanceMode,
      foodPreference: FOOD_PREFERENCE_VALUES[i % FOOD_PREFERENCE_VALUES.length],
      travelRequired,
      travelType: travelRequired ? TRAVEL_TYPES[i % TRAVEL_TYPES.length] : undefined,
      travelStatus: travelRequired ? (status === "accepted" ? "accepted" : status === "rejected" ? "rejected" : "pending") : undefined,
      medicalSupportRequired: medicalRequired,
      medicalSupportType: medicalRequired ? MEDICAL_SUPPORT_VALUES[i % MEDICAL_SUPPORT_VALUES.length] : undefined,
      translationRequired,
      translationLanguage: translationRequired ? TRANSLATION_LANGUAGE_VALUES[i % TRANSLATION_LANGUAGE_VALUES.length] : undefined,
      translationStatus: translationRequired ? (status === "accepted" ? "accepted" : status === "rejected" ? "rejected" : "pending") : undefined,
      status,
      createdAt: new Date(2025, 4, (i % 28) + 1, 10, i % 60).toISOString(),
      updatedAt: new Date(2025, 5, (i % 28) + 1, 14, i % 60).toISOString(),
    });
  }

  return registrations;
}

export const mockRegistrations = generateRegistrations();
