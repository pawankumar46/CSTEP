import { apiClient } from "@/lib/api-client";
import { extractApiErrorMessage, mapApiUser } from "@/lib/auth-mappers";
import { delay } from "@/lib/utils";
import { mockUsers } from "@/mock/users";
import type { User, UserRole, UserStatus } from "@/types";

const DEFAULT_PAGE_SIZE = 20;

let users = [...mockUsers];

export interface UsersPageResult {
  users: User[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

function extractUserList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  }

  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return ((data as { results: unknown[] }).results).filter(
      (item): item is Record<string, unknown> => !!item && typeof item === "object",
    );
  }

  return [];
}

function mapActiveUsers(list: Record<string, unknown>[]): User[] {
  return list
    .map((raw) => mapApiUser(raw))
    .filter((user) => user.status === "active");
}

export const getUsersPage = async (
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search = "",
): Promise<UsersPageResult> => {
  try {
    const { data } = await apiClient.get<unknown>("/auth/users/", {
      params: {
        page,
        page_size: pageSize,
        ...(search.trim() ? { search: search.trim() } : {}),
      },
    });

    const list = extractUserList(data);
    const mappedUsers = mapActiveUsers(list);

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const record = data as { count?: number; next?: string | null };
      const total = Number(record.count ?? mappedUsers.length);
      const hasMore = Boolean(record.next);

      return {
        users: mappedUsers,
        page,
        pageSize,
        total,
        hasMore,
      };
    }

    return {
      users: mappedUsers,
      page,
      pageSize,
      total: mappedUsers.length,
      hasMore: false,
    };
  } catch {
    await delay(300);
    const query = search.trim().toLowerCase();
    const filtered = users.filter((user) => {
      if (!query) return true;
      const name = `${user.firstName} ${user.lastName}`.toLowerCase();
      return name.includes(query) || user.email.toLowerCase().includes(query);
    });
    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);

    return {
      users: slice,
      page,
      pageSize,
      total: filtered.length,
      hasMore: start + pageSize < filtered.length,
    };
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const allUsers: User[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 100) {
      const result = await getUsersPage(page, 50);
      allUsers.push(...result.users);
      hasMore = result.hasMore;
      page += 1;
    }

    return allUsers;
  } catch {
    await delay(500);
    return [...users];
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const allUsers = await getUsers();
    return allUsers.find((user) => user.id === id) ?? null;
  } catch {
    await delay(300);
    return users.find((user) => user.id === id) ?? null;
  }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  try {
    const result = await getUsersPage(1, 20, normalized);
    return (
      result.users.find((user) => user.email.toLowerCase() === normalized) ??
      result.users[0] ??
      null
    );
  } catch {
    await delay(300);
    return users.find((user) => user.email.toLowerCase() === normalized) ?? null;
  }
};

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  await delay(500);
  const index = users.findIndex((user) => user.id === id);
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
  try {
    await apiClient.delete(`/auth/users/${id}/`);
    users = users.filter((user) => user.id !== id);
  } catch (error) {
    throw new Error(extractApiErrorMessage(error));
  }
};
