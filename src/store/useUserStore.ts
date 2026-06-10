import { create } from "zustand";
import * as userService from "@/services/user.service";
import type { User, UserRole, UserStatus } from "@/types";

interface UserState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  updateUserStatus: (id: string, status: UserStatus) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

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

  updateUserRole: async (id, role) => {
    try {
      const updated = await userService.updateUserRole(id, role);
      set({
        users: get().users.map((u) => (u.id === id ? updated : u)),
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
        users: get().users.map((u) => (u.id === id ? updated : u)),
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to update status" });
      throw err;
    }
  },

  deleteUser: async (id) => {
    try {
      await userService.deleteUser(id);
      set({ users: get().users.filter((u) => u.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to delete user" });
      throw err;
    }
  },
}));
