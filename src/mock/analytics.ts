import type { AnalyticsData, AuditLog, Permission } from "@/types";
import { mockRegistrations } from "./registrations";

const accepted = mockRegistrations.filter((r) => r.status === "accepted").length;
const rejected = mockRegistrations.filter((r) => r.status === "rejected").length;
const onHold = mockRegistrations.filter((r) => r.status === "on_hold").length;
const pending = mockRegistrations.filter((r) => r.status === "pending").length;

export const mockAnalytics: AnalyticsData = {
  summary: {
    totalUsers: 54,
    eventParticipants: mockRegistrations.length,
    accepted,
    rejected,
    onHold,
    pending,
  },
  registrationTrend: [
    { date: "Jan", value: 45 },
    { date: "Feb", value: 62 },
    { date: "Mar", value: 78 },
    { date: "Apr", value: 95 },
    { date: "May", value: 120 },
    { date: "Jun", value: 148 },
  ],
  participationTrend: [
    { date: "Week 1", value: 28 },
    { date: "Week 2", value: 35 },
    { date: "Week 3", value: 42 },
    { date: "Week 4", value: 38 },
    { date: "Week 5", value: 45 },
    { date: "Week 6", value: 52 },
  ],
  foodPreferences: [
    { name: "Vegetarian", value: 28, color: "#22c55e" },
    { name: "Jain", value: 16, color: "#84cc16" },
    { name: "Vegan", value: 14, color: "#10b981" },
    { name: "Satvik", value: 10, color: "#14b8a6" },
    { name: "Gluten Free", value: 8, color: "#0ea5e9" },
    { name: "Halal", value: 7, color: "#6366f1" },
    { name: "Diabetic Friendly", value: 6, color: "#8b5cf6" },
    { name: "Non-Veg (Chicken)", value: 18, color: "#f59e0b" },
    { name: "Non-Veg (Any)", value: 13, color: "#ef4444" },
  ],
  translationRequests: [
    { name: "Hindi", value: 14, color: "#f97316" },
    { name: "Tamil", value: 12, color: "#a855f7" },
    { name: "Kannada", value: 10, color: "#8b5cf6" },
    { name: "Malayalam", value: 9, color: "#ec4899" },
    { name: "Telugu", value: 8, color: "#d946ef" },
    { name: "Bengali", value: 6, color: "#06b6d4" },
    { name: "Marathi", value: 5, color: "#22c55e" },
    { name: "Punjabi", value: 4, color: "#f43f5e" },
  ],
  travelRequirements: [
    { name: "Flight + Taxi + Hotel", value: 15, color: "#3b82f6" },
    { name: "Taxi + Hotel", value: 12, color: "#6366f1" },
    { name: "Hotel Only", value: 8, color: "#8b5cf6" },
    { name: "Taxi Only", value: 5, color: "#a855f7" },
    { name: "Flight Only", value: 7, color: "#0ea5e9" },
    { name: "Train Only", value: 3, color: "#14b8a6" },
  ],
  languageRequests: [
    { name: "Hindi", value: 14 },
    { name: "Tamil", value: 12 },
    { name: "Kannada", value: 10 },
    { name: "Malayalam", value: 9 },
    { name: "Telugu", value: 8 },
    { name: "Bengali", value: 6 },
    { name: "Marathi", value: 5 },
    { name: "Gujarati", value: 4 },
    { name: "Punjabi", value: 4 },
  ],
  participationByDate: [
    { name: "21st August", value: 42 },
    { name: "22nd August", value: 38 },
    { name: "Both Days", value: 40 },
  ],
  monthlyRegistrations: [
    { date: "Jan", value: 120 },
    { date: "Feb", value: 180 },
    { date: "Mar", value: 240 },
    { date: "Apr", value: 310 },
    { date: "May", value: 380 },
    { date: "Jun", value: 450 },
  ],
  statusDistribution: [
    { name: "Accepted", value: accepted, color: "#22c55e" },
    { name: "Pending", value: pending, color: "#f59e0b" },
    { name: "On Hold", value: onHold, color: "#3b82f6" },
    { name: "Rejected", value: rejected, color: "#ef4444" },
  ],
};

export const mockAuditLogs: AuditLog[] = [
  { id: "log-1", userId: "user-super-admin", userName: "Dr. Sarah Mitchell", action: "UPDATE", resource: "User Role", details: "Changed role for user-015 to moderator", ipAddress: "192.168.1.100", createdAt: "2025-06-08T09:15:00Z" },
  { id: "log-2", userId: "user-event-admin", userName: "Mr. David Chen", action: "CREATE", resource: "Event", details: "Created event CSTEP Annual Conference 2025", ipAddress: "192.168.1.101", createdAt: "2025-06-08T08:30:00Z" },
  { id: "log-3", userId: "user-moderator", userName: "Ms. Emily Rodriguez", action: "UPDATE", resource: "Registration", details: "Accepted registration reg-042", ipAddress: "192.168.1.102", createdAt: "2025-06-07T16:45:00Z" },
  { id: "log-4", userId: "user-super-admin", userName: "Dr. Sarah Mitchell", action: "DELETE", resource: "User", details: "Suspended user user-030", ipAddress: "192.168.1.100", createdAt: "2025-06-07T14:20:00Z" },
  { id: "log-5", userId: "user-event-admin", userName: "Mr. David Chen", action: "UPDATE", resource: "Event", details: "Published event Sustainable Business Forum", ipAddress: "192.168.1.101", createdAt: "2025-06-07T11:00:00Z" },
  { id: "log-6", userId: "user-moderator", userName: "Ms. Emily Rodriguez", action: "UPDATE", resource: "Travel Request", details: "Approved travel for reg-018", ipAddress: "192.168.1.102", createdAt: "2025-06-06T15:30:00Z" },
  { id: "log-7", userId: "user-super-admin", userName: "Dr. Sarah Mitchell", action: "LOGIN", resource: "Auth", details: "Successful login", ipAddress: "192.168.1.100", createdAt: "2025-06-06T09:00:00Z" },
  { id: "log-8", userId: "user-moderator", userName: "Ms. Emily Rodriguez", action: "UPDATE", resource: "Translation Request", details: "Approved Tamil translation for reg-024", ipAddress: "192.168.1.102", createdAt: "2025-06-05T13:15:00Z" },
];

export const mockPermissions: Permission[] = [
  { id: "perm-1", name: "View Dashboard", description: "Access dashboard overview", roles: { base_user: true, moderator: true, event_administrator: true, super_administrator: true } },
  { id: "perm-2", name: "Manage Events", description: "Create, edit, delete events", roles: { base_user: false, moderator: false, event_administrator: true, super_administrator: true } },
  { id: "perm-3", name: "Manage Registrations", description: "Accept, reject, hold registrations", roles: { base_user: false, moderator: true, event_administrator: true, super_administrator: true } },
  { id: "perm-4", name: "View Analytics", description: "Access analytics and reports", roles: { base_user: false, moderator: true, event_administrator: true, super_administrator: true } },
  { id: "perm-5", name: "Manage Users", description: "Create, edit, suspend users", roles: { base_user: false, moderator: false, event_administrator: false, super_administrator: true } },
  { id: "perm-6", name: "Stream Control", description: "Control live stream", roles: { base_user: false, moderator: true, event_administrator: true, super_administrator: true } },
  { id: "perm-7", name: "View Recordings", description: "Access event recordings", roles: { base_user: true, moderator: true, event_administrator: true, super_administrator: true } },
  { id: "perm-8", name: "System Settings", description: "Configure system settings", roles: { base_user: false, moderator: false, event_administrator: false, super_administrator: true } },
];
