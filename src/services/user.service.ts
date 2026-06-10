import { delay } from "@/lib/utils";
import { mockUsers } from "@/mock/users";
import type { User, UserRole, UserStatus } from "@/types";

let users = [...mockUsers];

export const getUsers = async (): Promise<User[]> => {
  await delay(500);
  return [...users];
};

export const getUserById = async (id: string): Promise<User | null> => {
  await delay(300);
  return users.find((u) => u.id === id) || null;
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  await delay(500);
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) throw new Error("User not found");
  users[index] = { ...users[index], ...data, updatedAt: new Date().toISOString() };
  return users[index];
};

export const updateUserRole = async (id: string, role: UserRole): Promise<User> => {
  return updateUser(id, { role });
};

export const updateUserStatus = async (id: string, status: UserStatus): Promise<User> => {
  return updateUser(id, { status });
};

export const deleteUser = async (id: string): Promise<void> => {
  await delay(400);
  users = users.filter((u) => u.id !== id);
};
