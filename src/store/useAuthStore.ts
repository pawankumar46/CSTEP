import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authService from "@/services/auth.service";
import type { LoginCredentials, SignupCredentials, User, VerifyOtpPayload } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  signUp: (data: SignupCredentials) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

function syncTokenToStorage(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("auth_token", token);
  } else {
    localStorage.removeItem("auth_token");
  }
}

function syncRefreshToStorage(refreshToken: string | null) {
  if (typeof window === "undefined") return;
  if (refreshToken) {
    localStorage.setItem("auth_refresh", refreshToken);
  } else {
    localStorage.removeItem("auth_refresh");
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      hasHydrated: false,

      signUp: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authService.signUp(data);
          set({ isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Sign up failed",
            isLoading: false,
          });
          throw err;
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token, refreshToken } = await authService.login(credentials);
          syncTokenToStorage(token);
          syncRefreshToStorage(refreshToken || null);
          set({
            user,
            token,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
            hasHydrated: true,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Login failed",
            isLoading: false,
          });
          throw err;
        }
      },

      verifyOtp: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          await authService.verifyOtp(payload);
          set({ isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "OTP verification failed",
            isLoading: false,
          });
          throw err;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await authService.forgotPassword(email);
          set({ isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to send reset email",
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        const { token, refreshToken } = get();
        const storedRefresh =
          refreshToken ??
          (typeof window !== "undefined" ? localStorage.getItem("auth_refresh") : null);

        await authService.logout(storedRefresh, token);

        syncTokenToStorage(null);
        syncRefreshToStorage(null);
        const { useRegistrationStore } = await import("@/store/useRegistrationStore");
        useRegistrationStore.getState().clearRegistrationSession();
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          hasHydrated: true,
        });
        await useAuthStore.persist.clearStorage();
      },

      hydrate: async () => {
        const { token, user, hasHydrated } = get();
        if (!hasHydrated) return;

        syncTokenToStorage(token);

        if (token && user) {
          set({ isAuthenticated: true, isLoading: false });
          return;
        }

        if (!token) {
          set({ isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const resolvedUser = await authService.getCurrentUser();
          if (resolvedUser) {
            set({ user: resolvedUser, isAuthenticated: true, isLoading: false });
            return;
          }

          syncTokenToStorage(null);
          syncRefreshToStorage(null);
          authService.clearAuthStorage();
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch {
          if (user && token) {
            set({ isAuthenticated: true, isLoading: false });
            return;
          }
          set({ isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          syncTokenToStorage(state.token);
          syncRefreshToStorage(state.refreshToken ?? null);
          if (state.user) {
            state.isAuthenticated = true;
          }
        }
      },
    }
  )
);
