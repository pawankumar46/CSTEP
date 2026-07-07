import type { Feedback } from "@/types";

export const mockFeedback: Feedback[] = [
  { id: "fb-001", userId: "user-001", userName: "Arjun Mehta", eventId: "evt-001", eventName: "ICAS", sessionDate: "2026-08-19", sessionTitle: "Session 1", rating: 3, comments: "Good opening session with useful context.", createdAt: "2025-09-22T18:30:00Z" },
  { id: "fb-002", userId: "user-002", userName: "Priya Sharma", eventId: "evt-003", eventName: "ICAS", sessionDate: "2026-08-19", sessionTitle: "Session 2", rating: 5, comments: "Excellent content and smooth delivery.", createdAt: "2025-11-08T17:45:00Z" },
  { id: "fb-003", userId: "user-003", userName: "Rohit Desai", eventId: "evt-006", eventName: "ICAS", sessionDate: "2026-08-20", sessionTitle: "Session 3", rating: 5, comments: "Practical insights I can implement immediately.", createdAt: "2025-08-13T16:20:00Z" },
  { id: "fb-004", userId: "user-004", userName: "Ananya Iyer", eventId: "evt-002", eventName: "ICAS", sessionDate: "2026-08-19", sessionTitle: "Session 4", rating: 4, comments: "Relevant topics and good discussion.", createdAt: "2025-10-16T17:00:00Z" },
  { id: "fb-005", userId: "user-005", userName: "Vikram Patel", eventId: "evt-001", eventName: "ICAS", sessionDate: "2026-08-19", sessionTitle: "Overall", rating: 5, comments: "Strong first day overall.", createdAt: "2025-09-22T19:15:00Z" },
  { id: "fb-006", userId: "user-006", userName: "Kavita Reddy", eventId: "evt-004", eventName: "ICAS", sessionDate: "2026-08-20", sessionTitle: "Session 4", rating: 5, comments: "Innovative showcase with great demos.", createdAt: "2025-12-06T18:00:00Z" },
  { id: "fb-007", userId: "user-007", userName: "Suresh Nair", eventId: "evt-003", eventName: "ICAS", sessionDate: "2026-08-20", sessionTitle: "Session 2", rating: 4, comments: "Thought-provoking policy discussions.", createdAt: "2025-11-08T18:30:00Z" },
  { id: "fb-008", userId: "user-008", userName: "Meera Krishnan", eventId: "evt-006", eventName: "ICAS", sessionDate: "2026-08-20", sessionTitle: "Overall", rating: 5, comments: "Well organized second day.", createdAt: "2025-08-13T17:45:00Z" },
  { id: "fb-009", userId: "user-009", userName: "Rahul Singh", eventId: "evt-001", eventName: "ICAS", sessionDate: "2026-08-19", sessionTitle: "Session 3", rating: 4, comments: "Good networking opportunities.", createdAt: "2025-09-22T20:00:00Z" },
  { id: "fb-010", userId: "user-010", userName: "Deepa Menon", eventId: "evt-007", eventName: "ICAS", sessionDate: "2026-08-20", sessionTitle: "Session 1", rating: 5, comments: "Strong start to day two.", createdAt: "2026-02-10T17:30:00Z" },
  { id: "fb-011", userId: "user-011", userName: "Aditya Rao", eventId: "evt-002", eventName: "ICAS", sessionDate: "overall", sessionTitle: "Overall Event", rating: 5, comments: "Excellent event across all three days.", createdAt: "2025-10-16T18:15:00Z" },
  { id: "fb-012", userId: "user-012", userName: "Sunita Kulkarni", eventId: "evt-004", eventName: "ICAS", sessionDate: "2026-08-19", sessionTitle: "Session 1", rating: 3, comments: "Solid session but room was crowded.", createdAt: "2025-12-06T19:00:00Z" },
  { id: "fb-013", userId: "user-013", userName: "Karthik Venkatesh", eventId: "evt-001", eventName: "ICAS", sessionDate: "2026-08-21", sessionTitle: "Session 2", rating: 4, comments: "Strong closing-day discussions.", createdAt: "2025-09-23T10:00:00Z" },
  { id: "fb-014", userId: "user-014", userName: "Lakshmi Pandey", eventId: "evt-001", eventName: "ICAS", sessionDate: "2026-08-21", sessionTitle: "Overall", rating: 5, comments: "Great wrap-up to the summit.", createdAt: "2025-09-23T11:00:00Z" },
];

export const mockChatMessages = [
  { id: "msg-1", userId: "user-001", userName: "Arjun Mehta", message: "Great session so far!", timestamp: "09:15 AM" },
  { id: "msg-2", userId: "user-002", userName: "Priya Sharma", message: "Looking forward to the next session.", timestamp: "09:18 AM" },
  { id: "msg-3", userId: "user-003", userName: "Rohit Desai", message: "The streaming quality is excellent.", timestamp: "09:22 AM" },
  { id: "msg-4", userId: "user-004", userName: "Ananya Iyer", message: "Can we get the slides shared after the session?", timestamp: "09:25 AM" },
  { id: "msg-5", userId: "user-005", userName: "Vikram Patel", message: "Very informative presentation!", timestamp: "09:30 AM" },
];

export const mockNotifications = [
  { id: "notif-1", title: "Registration Confirmed", message: "Your registration for ICAS has been accepted", type: "success" as const, read: false, createdAt: "2025-06-01T10:00:00Z" },
  { id: "notif-2", title: "Travel Arranged", message: "Your flight booking has been confirmed for Sep 21", type: "info" as const, read: false, createdAt: "2025-06-02T14:30:00Z" },
  { id: "notif-3", title: "Session Reminder", message: "Session 1 starts in 30 minutes", type: "info" as const, read: true, createdAt: "2025-06-03T08:30:00Z" },
  { id: "notif-4", title: "Registration Update", message: "Your registration status has been updated to Accepted", type: "success" as const, read: true, createdAt: "2025-06-04T11:00:00Z" },
  { id: "notif-5", title: "Feedback Received", message: "New 5-star feedback on Session 1", type: "success" as const, read: true, createdAt: "2025-06-05T14:30:00Z" },
];
