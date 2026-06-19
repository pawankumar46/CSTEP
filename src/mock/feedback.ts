import type { Feedback } from "@/types";

export const mockFeedback: Feedback[] = [
  { id: "fb-001", userId: "user-001", userName: "James Smith", eventId: "evt-001", eventName: "CSTEP Annual Conference 2025", rating: 5, feedback: "Exceptional event! The keynote speakers were incredibly insightful and the networking opportunities were invaluable.", suggestions: "Would love to see more hands-on workshops next year.", createdAt: "2025-09-22T18:30:00Z" },
  { id: "fb-002", userId: "user-002", userName: "Mary Johnson", eventId: "evt-003", eventName: "Sustainable Business Forum", rating: 4, feedback: "Great content on ESG strategies. The virtual experience was seamless and well-organized.", suggestions: "More breakout sessions for smaller group discussions.", createdAt: "2025-11-08T17:45:00Z" },
  { id: "fb-003", userId: "user-003", userName: "Robert Williams", eventId: "evt-006", eventName: "Cybersecurity World Congress", rating: 5, feedback: "Best cybersecurity conference I've attended. Practical insights I can implement immediately.", suggestions: "Add a CTF competition track.", createdAt: "2025-08-13T16:20:00Z" },
  { id: "fb-004", userId: "user-004", userName: "Patricia Brown", eventId: "evt-002", eventName: "Healthcare Innovation Conference", rating: 4, feedback: "Excellent speakers and relevant topics. The medical support during the event was outstanding.", suggestions: "Longer Q&A sessions with speakers.", createdAt: "2025-10-16T17:00:00Z" },
  { id: "fb-005", userId: "user-005", userName: "John Jones", eventId: "evt-001", eventName: "CSTEP Annual Conference 2025", rating: 3, feedback: "Good event overall but some sessions ran over time causing schedule conflicts.", suggestions: "Better time management and buffer between sessions.", createdAt: "2025-09-22T19:15:00Z" },
  { id: "fb-006", userId: "user-006", userName: "Jennifer Garcia", eventId: "evt-004", eventName: "AI & Machine Learning Expo", rating: 5, feedback: "Cutting-edge AI demonstrations and excellent vendor showcases. Highly recommend!", suggestions: "More beginner-friendly tracks.", createdAt: "2025-12-06T18:00:00Z" },
  { id: "fb-007", userId: "user-007", userName: "Michael Miller", eventId: "evt-003", eventName: "Sustainable Business Forum", rating: 4, feedback: "Thought-provoking discussions on sustainability. Translation support was very helpful.", suggestions: "Include more case studies from SMEs.", createdAt: "2025-11-08T18:30:00Z" },
  { id: "fb-008", userId: "user-008", userName: "Linda Davis", eventId: "evt-006", eventName: "Cybersecurity World Congress", rating: 5, feedback: "World-class security experts and practical workshops. The travel arrangements were perfectly coordinated.", suggestions: "Offer recorded sessions for 30 days post-event.", createdAt: "2025-08-13T17:45:00Z" },
  { id: "fb-009", userId: "user-009", userName: "David Rodriguez", eventId: "evt-001", eventName: "CSTEP Annual Conference 2025", rating: 4, feedback: "Impressive scale and production quality. Food options accommodated all dietary preferences well.", suggestions: "Mobile app for schedule navigation.", createdAt: "2025-09-22T20:00:00Z" },
  { id: "fb-010", userId: "user-010", userName: "Elizabeth Martinez", eventId: "evt-007", eventName: "Education Technology Conference", rating: 5, feedback: "Innovative EdTech solutions showcased brilliantly. Great platform for educators.", suggestions: "Student discount program.", createdAt: "2026-02-10T17:30:00Z" },
  { id: "fb-011", userId: "user-011", userName: "William Hernandez", eventId: "evt-002", eventName: "Healthcare Innovation Conference", rating: 4, feedback: "Valuable insights into digital health transformation. Well-structured agenda.", suggestions: "More interactive demos.", createdAt: "2025-10-16T18:15:00Z" },
  { id: "fb-012", userId: "user-012", userName: "Barbara Lopez", eventId: "evt-004", eventName: "AI & Machine Learning Expo", rating: 3, feedback: "Technical depth was excellent but venue was crowded during peak sessions.", suggestions: "Larger venue or cap session attendance.", createdAt: "2025-12-06T19:00:00Z" },
];

export const mockNotifications = [
  { id: "notif-1", title: "New Registration", message: "15 new registrations received today", type: "info" as const, read: false, createdAt: "2025-06-08T10:00:00Z" },
  { id: "notif-2", title: "Event Live", message: "Sustainable Business Forum is now live", type: "success" as const, read: false, createdAt: "2025-06-08T09:00:00Z" },
  { id: "notif-3", title: "Travel Request", message: "3 pending travel requests need approval", type: "warning" as const, read: true, createdAt: "2025-06-07T16:00:00Z" },
  { id: "notif-4", title: "System Update", message: "Platform maintenance scheduled for Sunday", type: "info" as const, read: true, createdAt: "2025-06-06T12:00:00Z" },
  { id: "notif-5", title: "Feedback Received", message: "New 5-star feedback on CSTEP Annual Conference", type: "success" as const, read: true, createdAt: "2025-06-05T14:30:00Z" },
];

export const mockChatMessages = [
  { id: "chat-1", userId: "user-001", userName: "Arjun Menon", message: "Great keynote so far!", timestamp: "2025-06-08T09:15:00Z" },
  { id: "chat-2", userId: "user-002", userName: "Priya Nair", message: "The AI panel was incredibly insightful", timestamp: "2025-06-08T09:18:00Z" },
  { id: "chat-3", userId: "user-moderator", userName: "Ananya Desai", message: "Q&A session starting in 5 minutes", timestamp: "2025-06-08T09:20:00Z" },
  { id: "chat-4", userId: "user-003", userName: "Vikram Singh", message: "Anyone attending the networking lunch?", timestamp: "2025-06-08T09:25:00Z" },
  { id: "chat-5", userId: "user-004", userName: "Kavita Reddy", message: "Yes! See you there", timestamp: "2025-06-08T09:26:00Z" },
];
