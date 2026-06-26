import { create } from "zustand";
import * as userService from "@/services/user.service";
import type { User, UserRole, UserStatus } from "@/types";

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  userOptions: User[];
  userOptionsPage: number;
  userOptionsHasMore: boolean;
  userOptionsSearch: string;
  isLoadingUserOptions: boolean;
  isLoadingMoreUserOptions: boolean;
  fetchUsers: () => Promise<void>;
  fetchUserOptions: (search?: string) => Promise<void>;
  loadMoreUserOptions: () => Promise<void>;
  resetUserOptions: () => void;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  updateUserStatus: (id: string, status: UserStatus) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,
  userOptions: [],
  userOptionsPage: 0,
  userOptionsHasMore: true,
  userOptionsSearch: "",
  isLoadingUserOptions: false,
  isLoadingMoreUserOptions: false,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await userService.getUsers();
      set({ users, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch users",
        isLoading: false,
      });
    }
  },

  fetchUserOptions: async (search) => {
    const searchQuery = search ?? get().userOptionsSearch;
    set({
      isLoadingUserOptions: true,
      error: null,
      userOptionsSearch: searchQuery,
      userOptionsPage: 1,
    });

    try {
      const result = await userService.getUsersPage(1, 20, searchQuery);
      set({
        userOptions: result.users,
        userOptionsPage: result.page,
        userOptionsHasMore: result.hasMore,
        isLoadingUserOptions: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to fetch users",
        userOptions: [],
        userOptionsHasMore: false,
        isLoadingUserOptions: false,
      });
    }
  },

  loadMoreUserOptions: async () => {
    const {
      userOptionsHasMore,
      isLoadingMoreUserOptions,
      isLoadingUserOptions,
      userOptionsPage,
      userOptionsSearch,
      userOptions,
    } = get();

    if (!userOptionsHasMore || isLoadingMoreUserOptions || isLoadingUserOptions) {
      return;
    }

    const nextPage = userOptionsPage + 1;
    set({ isLoadingMoreUserOptions: true });

    try {
      const result = await userService.getUsersPage(nextPage, 20, userOptionsSearch);
      const existingIds = new Set(userOptions.map((user) => user.id));
      const merged = [
        ...userOptions,
        ...result.users.filter((user) => !existingIds.has(user.id)),
      ];

      set({
        userOptions: merged,
        userOptionsPage: result.page,
        userOptionsHasMore: result.hasMore,
        isLoadingMoreUserOptions: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load more users",
        isLoadingMoreUserOptions: false,
      });
    }
  },

  resetUserOptions: () => {
    set({
      userOptions: [],
      userOptionsPage: 0,
      userOptionsHasMore: true,
      userOptionsSearch: "",
      isLoadingUserOptions: false,
      isLoadingMoreUserOptions: false,
    });
  },

  updateUserRole: async (id, role) => {
    try {
      const updated = await userService.updateUserRole(id, role);
      set({
        users: get().users.map((user) => (user.id === id ? updated : user)),
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update role" });
      throw err;
    }
  },

  updateUserStatus: async (id, status) => {
    try {
      const updated = await userService.updateUserStatus(id, status);
      set({
        users: get().users.map((user) => (user.id === id ? updated : user)),
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update status" });
      throw err;
    }
  },

  deleteUser: async (id) => {
    try {
      await userService.deleteUser(id);
      set({ users: get().users.filter((user) => user.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to delete user" });
      throw err;
    }
  },
}));
