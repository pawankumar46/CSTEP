export type UserRole =
  | "base_user"
  | "moderator"
  | "event_administrator"
  | "super_administrator";

export type UserStatus = "active" | "suspended" | "pending";

export interface User {
  id: string;
  salutation?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventStatus = "draft" | "published" | "live" | "completed" | "cancelled";

export type EventListType = "upcoming" | "live" | "past";
export type EventScheduleType = "WHOLE_DAY" | "MULTI_SESSION";

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  endDate?: string;
  status: EventStatus;
  location: string;
  maxParticipants: number;
  registeredCount: number;
  imageUrl: string;
  videoUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  scheduleType?: EventScheduleType;
  travelAssistance?: boolean;
  medicalAssistance?: boolean;
  translationAssistance?: boolean;
  accommodationAssistance?: boolean;
}

export interface EventRegistrationSummary {
  totalRegisteredUsers: number;
  participantsAttended: number;
  participantsAccepted: number;
  participantsRejected: number;
  participantsPending: number;
  participantsHeld: number;
}

export interface UpcomingEvent extends Event {
  isRegistered: boolean;
  summary?: EventRegistrationSummary;
}

/** Lightweight event option from GET /events/event/dropdown/ */
export interface EventDropdownOption {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  scheduleType?: EventScheduleType;
  travelAssistance?: boolean;
  medicalAssistance?: boolean;
  translationAssistance?: boolean;
  accommodationAssistance?: boolean;
}

export interface CreateEventPayload {
  title: string;
  description: string;
  scheduledStart: string;
  scheduledEnd: string;
  videoMutedByDefault: boolean;
  pauseContinueEnabled: boolean;
  scheduleType: EventScheduleType;
  travelAssistance: boolean;
  medicalAssistance: boolean;
  translationAssistance: boolean;
  accommodationAssistance: boolean;
}

export type UpdateEventPayload = Partial<CreateEventPayload>;

export type RegistrationStatus = "pending" | "accepted" | "rejected" | "on_hold";

export type AssistanceRequestStatus = "pending" | "accepted" | "rejected" | "on_hold";

export type AssistanceActionStatus = "accepted" | "rejected" | "on_hold";

export type ParticipationDate = "21st" | "22nd" | "both_days" | (string & {});
export type ParticipationTime = "half_day" | "full_day";
export type AttendanceMode = "physical" | "virtual";
export type FoodPreference =
  | "veg"
  | "jain"
  | "vegan"
  | "satvik"
  | "egg_veg"
  | "pescetarian"
  | "gluten_free"
  | "lactose_free"
  | "diabetic_friendly"
  | "nut_allergy"
  | "halal"
  | "non_veg_chicken"
  | "non_veg_any";

export type TravelType =
  | "flight_taxi_hotel"
  | "taxi_hotel"
  | "hotel_only"
  | "taxi_only"
  | "flight_only"
  | "train_only";

export type MedicalSupportType =
  | "wheel_chair"
  | "mobility_assistance"
  | "attender"
  | "blind_companion"
  | "hearing_impaired"
  | "sign_language_interpreter"
  | "oxygen_support"
  | "guide_dog"
  | "reserved_seating"
  | "other_medical";

export type TranslationLanguage =
  | "hindi"
  | "english"
  | "kannada"
  | "tamil"
  | "telugu"
  | "malayalam"
  | "punjabi"
  | "bengali"
  | "marathi"
  | "gujarati"
  | "odia"
  | "assamese"
  | "urdu";

export interface TravelAssistanceItem {
  id: string;
  transportMode: string;
  transportModeLabel: string;
  sourceLocation: string;
  destinationLocation: string;
  travelDate: string;
  status: AssistanceRequestStatus;
}

export interface TranslationAssistanceItem {
  id: string;
  language: TranslationLanguage;
  requiredDate: string;
  status: AssistanceRequestStatus;
}

export interface MedicalAssistanceItem {
  id: string;
  medicalNeeds: string;
  requiredDate: string;
  status: AssistanceRequestStatus;
}

export interface AccommodationAssistanceItem {
  id: string;
  eventId: string;
  hotelName: string;
  address: string;
  roomNo: string;
  fromDate: string;
  toDate: string;
  status: AssistanceRequestStatus;
}

export interface TravelAssistanceRow extends TravelAssistanceItem {
  registrationId: string;
  userName: string;
  email: string;
  phone: string;
}

export interface TranslationAssistanceRow extends TranslationAssistanceItem {
  registrationId: string;
  userName: string;
  email: string;
  phone: string;
}

export interface MedicalAssistanceRow extends MedicalAssistanceItem {
  registrationId: string;
  userName: string;
  email: string;
  phone: string;
}

export interface AccommodationAssistanceRow extends AccommodationAssistanceItem {
  registrationId: string;
  userName: string;
  email: string;
  phone: string;
}

export interface SessionRegistration {
  id: string;
  registrationId: string;
  scheduleItemId: string;
  sessionTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  track: string;
  status: AssistanceRequestStatus;
  registeredAt: string;
}

export interface RegistrationDay {
  id: string;
  dayId: string;
  dayNumber?: number;
  date: string;
  attendanceMode: AttendanceMode;
  sessions: SessionRegistration[];
}

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  userName: string;
  email: string;
  phone: string;
  participationDate: ParticipationDate;
  participationDateLabel?: string;
  participationTime: ParticipationTime;
  registeredDaysCount?: number;
  registeredSessionsCount?: number;
  selectedDayIds?: string[];
  days?: RegistrationDay[];
  sessionRegistrations?: SessionRegistration[];
  /** Present on detail / filtered list; omitted on lobby list when API sends only registration_dates. */
  attendanceMode?: AttendanceMode;
  foodPreference: FoodPreference;
  travelAssistance?: TravelAssistanceItem[];
  translationAssistance?: TranslationAssistanceItem;
  medicalAssistance?: MedicalAssistanceItem;
  travelRequired: boolean;
  travelType?: TravelType;
  travelArrangementLabel?: string;
  travelStatus?: AssistanceRequestStatus;
  medicalSupportRequired: boolean;
  medicalSupportType?: MedicalSupportType;
  translationRequired: boolean;
  translationLanguage?: TranslationLanguage;
  translationStatus?: AssistanceRequestStatus;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TravelRequest {
  id: string;
  registrationId: string;
  userId: string;
  userName: string;
  email: string;
  travelType: TravelType;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface TranslationRequest {
  id: string;
  registrationId: string;
  userId: string;
  userName: string;
  email: string;
  language: TranslationLanguage;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface Recording {
  id: string;
  eventId: string;
  eventName: string;
  name: string;
  duration: string;
  date: string;
  thumbnailUrl: string;
  videoUrl: string;
  views: number;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  eventId: string;
  eventName: string;
  sessionDate: string;
  sessionTitle: string;
  rating: number;
  comments: string;
  createdAt: string;
}

export interface AnalyticsSummary {
  totalUsers: number;
  eventParticipants: number;
  accepted: number;
  rejected: number;
  onHold: number;
  pending: number;
}

export interface DashboardTopEvent {
  id: string;
  title: string;
  status: string;
  registrationCount: number;
}

export interface DashboardAnalytics {
  events: {
    total: number;
    byStatus: Record<string, number>;
  };
  registrations: {
    total: number;
    byStatus: Record<string, number>;
  };
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  topEventsByRegistrations: DashboardTopEvent[];
  viewers: {
    totalSessions: number;
    currentlyWatching: number;
  };
}

export interface EventAnalyticsAssistance {
  total: number;
  byStatus: Record<string, number>;
  byTransportMode?: Record<string, number>;
  byLanguage?: Record<string, number>;
}

export interface EventAnalyticsParticipationDate {
  date: string;
  count: number;
}

export interface EventAnalyticsDay {
  id: string;
  date: string;
  registrationsCount: number;
  sessionsCount: number;
  byAttendanceMode?: Record<string, number>;
}

export interface RegistrationIntervalBucket {
  bucketStart: string;
  count: number;
}

export interface RegistrationIntervalDay {
  date: string;
  intervalMinutes: number;
  buckets: RegistrationIntervalBucket[];
}

export interface EventAnalyticsSession {
  id: string;
  title: string;
  dayDate: string;
  registrationsCount: number;
}

export interface ParticipationTimeSession {
  id: string;
  userName: string;
  email?: string;
  loggedInAt: string;
  loggedOutAt: string | null;
  durationSeconds: number;
}

export interface EventAnalytics {
  event: {
    id: string;
    title: string;
    status: string;
  };
  registrations: {
    total: number;
    byStatus: Record<string, number>;
    byAttendanceMode: Record<string, number>;
    byFoodPreference: Record<string, number>;
    byParticipationTime: Record<string, number>;
  };
  participationDates: EventAnalyticsParticipationDate[];
  days: EventAnalyticsDay[];
  sessions: EventAnalyticsSession[];
  assistanceRequests: {
    travel: EventAnalyticsAssistance;
    medical: EventAnalyticsAssistance;
    translation: EventAnalyticsAssistance;
    accommodation: EventAnalyticsAssistance;
  };
  streaming: {
    broadcastSessions: number;
    primaryBroadcastActive: boolean;
    totalViewerSessions: number;
    uniqueViewers: number;
    currentlyWatching: number;
    avgWatchDurationSeconds: number;
    totalWatchTimeSeconds: number;
    peakConcurrentViewers: number;
    logins: number;
  };
  participationTimeSessions: ParticipationTimeSession[];
  registrationIntervalsByDay: RegistrationIntervalDay[];
}

export interface TrendDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface DistributionDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  dashboard: DashboardAnalytics;
  registrationTrend: TrendDataPoint[];
  participationTrend: TrendDataPoint[];
  foodPreferences: DistributionDataPoint[];
  translationRequests: DistributionDataPoint[];
  travelRequirements: DistributionDataPoint[];
  languageRequests: DistributionDataPoint[];
  participationByDate: DistributionDataPoint[];
  monthlyRegistrations: TrendDataPoint[];
  statusDistribution: DistributionDataPoint[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  roles: Record<UserRole, boolean>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  company: string;
  bio: string;
  imageUrl: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  speaker: string;
  description: string;
}

export interface EventSession {
  id: string;
  eventId: string;
  title: string;
  speaker: string;
  description: string;
  startTime: string;
  endTime: string;
  venue?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export interface StreamState {
  isLive: boolean;
  isPaused: boolean;
  isMuted: boolean;
  viewerCount: number;
  currentSpeaker: string;
}

export interface RegistrationFormData {
  eventId: string;
  salutation: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  email: string;
  participationDate?: ParticipationDate;
  participationTime: ParticipationTime;
  selectedDayIds?: string[];
  selectedSessionIds?: string[];
  sessionsByDay?: Record<string, string[]>;
  attendanceByDay?: Record<string, AttendanceMode>;
  attendanceMode: AttendanceMode;
}

export type ApiUserRole = "BASE_USER" | "MODERATOR" | "EVENT_ADMIN" | "SUPER_ADMIN";

export type OtpVerifyMethod = "phone" | "email";

export interface VerifyOtpPayload {
  method: OtpVerifyMethod;
  otp: string;
  phone?: string;
  email?: string;
}

export interface ResetPasswordPayload {
  phone: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SignupAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
}

export type SignupOrgType = "ORGANISATION" | "INDEPENDENT";
export type SignupGender = "MALE" | "FEMALE" | "OTHER";

export interface SignupCredentials {
  salutation: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
  email: string;
  gender: SignupGender;
  designation: string;
  orgType: SignupOrgType;
  orgName?: string;
  motivation: string;
  city: string;
  state: string;
  /** Lobby signup may still collect a full address; city/state are preferred when set. */
  address?: SignupAddress;
  password: string;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateBroadcastSessionPayload {
  eventId: string;
  broadcasterId: string;
  name: string;
  isPrimary: boolean;
}

export interface BroadcastSessionSummary {
  id: string;
  eventId: string;
  eventTitle: string;
  broadcasterId: string;
  broadcasterName: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export type BroadcastUrlTarget =
  | "ingest.rtmp"
  | "ingest.rtsp"
  | "ingest.webrtc"
  | "playback.hls"
  | "playback.rtsp"
  | "playback.webrtc"
  | "stream_key";

export interface BroadcastStreamUrls {
  rtmp?: string;
  rtsp?: string;
  webrtc?: string;
  hls?: string;
}

export interface BroadcastSession {
  id: string;
  eventId: string;
  eventTitle: string;
  broadcasterId: string;
  broadcasterName: string;
  name: string;
  isPrimary: boolean;
  streamKey: string;
  ingestUrls: BroadcastStreamUrls;
  playbackUrls: BroadcastStreamUrls;
  isActive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  /** Convenience: HLS playback URL for viewers */
  liveVideoUrl?: string;
}
