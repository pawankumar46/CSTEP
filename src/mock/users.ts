import type { User, UserRole } from "@/types";

const SALUTATIONS = ["Mr", "Mrs", "Ms", "Dr", "Prof"];
const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Christopher", "Karen", "Daniel", "Lisa", "Matthew", "Nancy",
  "Anthony", "Betty", "Mark", "Margaret", "Donald", "Sandra", "Steven", "Ashley",
  "Paul", "Kimberly", "Andrew", "Emily", "Joshua", "Donna", "Kenneth", "Michelle",
  "Kevin", "Dorothy", "Brian", "Carol", "George", "Amanda", "Timothy", "Melissa",
  "Ronald", "Deborah", "Edward", "Stephanie", "Jason", "Rebecca", "Jeffrey", "Sharon",
];
const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
];

const ROLES: UserRole[] = [
  "base_user", "base_user", "base_user", "base_user", "base_user",
  "base_user", "base_user", "base_user", "base_user", "base_user",
  "moderator", "moderator", "moderator",
  "event_administrator", "event_administrator",
  "super_administrator",
];

function generateUsers(): User[] {
  const users: User[] = [
    {
      id: "user-super-admin",
      salutation: "Dr",
      firstName: "Sarah",
      lastName: "Mitchell",
      email: "superadmin@cstep.com",
      phone: "+1-555-0100",
      role: "super_administrator",
      status: "active",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2025-06-01T10:00:00Z",
    },
    {
      id: "user-event-admin",
      salutation: "Mr",
      firstName: "David",
      lastName: "Chen",
      email: "admin@cstep.com",
      phone: "+1-555-0101",
      role: "event_administrator",
      status: "active",
      createdAt: "2024-02-01T10:00:00Z",
      updatedAt: "2025-06-01T10:00:00Z",
    },
    {
      id: "user-moderator",
      salutation: "Ms",
      firstName: "Emily",
      lastName: "Rodriguez",
      email: "moderator@cstep.com",
      phone: "+1-555-0102",
      role: "moderator",
      status: "active",
      createdAt: "2024-02-15T10:00:00Z",
      updatedAt: "2025-06-01T10:00:00Z",
    },
    {
      id: "user-base",
      salutation: "Mr",
      firstName: "Alex",
      lastName: "Thompson",
      email: "user@cstep.com",
      phone: "+1-555-0103",
      role: "base_user",
      status: "active",
      createdAt: "2024-03-01T10:00:00Z",
      updatedAt: "2025-06-01T10:00:00Z",
    },
  ];

  for (let i = 0; i < 50; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const role = ROLES[i % ROLES.length];
    users.push({
      id: `user-${String(i + 1).padStart(3, "0")}`,
      salutation: SALUTATIONS[i % SALUTATIONS.length],
      firstName,
      middleName: i % 3 === 0 ? FIRST_NAMES[(i + 5) % FIRST_NAMES.length] : undefined,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      phone: `+1-555-${String(1000 + i).padStart(4, "0")}`,
      role,
      status: i % 15 === 0 ? "suspended" : i % 10 === 0 ? "pending" : "active",
      createdAt: new Date(2024, i % 12, (i % 28) + 1).toISOString(),
      updatedAt: new Date(2025, (i + 3) % 12, (i % 28) + 1).toISOString(),
    });
  }

  return users;
}

export const mockUsers = generateUsers();
