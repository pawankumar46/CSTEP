import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authService from "@/services/auth.service";
import {
  clearSessionTokens,
  setSessionTokens,
} from "@/lib/auth-session";
import {
  clearAccessTokenRefreshSchedule,
  getLastAccessTokenRefreshAt,
  markAccessTokenRefreshed,
} from "@/lib/auth-token";
import type { LoginCredentials, ResetPasswordPayload, SignupCredentials, User, VerifyOtpPayload } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  signUp: (data: SignupCredentials) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  requestPhoneOtpLogin: (phone: string) => Promise<void>;
  loginWithPhoneOtp: (phone: string, otp: string) => Promise<void>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<void>;
  forgotPassword: (phone: string) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>;
  updateProfile: (payload: {
    salutation?: string;
    firstName: string;
    middleName?: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  clearError: () => void;
}

function syncTokenToStorage(token: string | null, refreshToken?: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    setSessionTokens(token, refreshToken ?? undefined);
  } else {
    clearSessionTokens();
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
      isLoggingOut: false,
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
          syncTokenToStorage(token, refreshToken || null);
          syncRefreshToStorage(refreshToken || null);
          markAccessTokenRefreshed();
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

      requestPhoneOtpLogin: async (phone) => {
        set({ isLoading: true, error: null });
        try {
          await authService.requestPhoneOtpLogin(phone);
          set({ isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to send login OTP",
            isLoading: false,
          });
          throw err;
        }
      },

      loginWithPhoneOtp: async (phone, otp) => {
        set({ isLoading: true, error: null });
        try {
          const { user, token, refreshToken } = await authService.loginWithPhoneOtp(phone, otp);
          syncTokenToStorage(token, refreshToken || null);
          syncRefreshToStorage(refreshToken || null);
          markAccessTokenRefreshed();
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
            error: err instanceof Error ? err.message : "OTP login failed",
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

      forgotPassword: async (phone) => {
        set({ isLoading: true, error: null });
        try {
          await authService.forgotPassword(phone);
          set({ isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to send reset OTP",
            isLoading: false,
          });
          throw err;
        }
      },

      resetPassword: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(payload);
          set({ isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Failed to reset password",
            isLoading: false,
          });
          throw err;
        }
      },

      updateProfile: async (payload) => {
        await authService.updateProfile(payload);
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                salutation: payload.salutation ?? state.user.salutation,
                firstName: payload.firstName,
                middleName: payload.middleName,
                lastName: payload.lastName,
              }
            : state.user,
        }));
      },

      logout: async () => {
        set({ isLoggingOut: true });
        try {
          const { token, refreshToken } = get();
          const storedRefresh =
            refreshToken ??
            (typeof window !== "undefined" ? localStorage.getItem("auth_refresh") : null);

          await authService.logout(storedRefresh, token);

          syncTokenToStorage(null);
          syncRefreshToStorage(null);
          clearAccessTokenRefreshSchedule();
          const { useRegistrationStore } = await import("@/store/useRegistrationStore");
          useRegistrationStore.getState().clearRegistrationSession();
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            isLoggingOut: false,
            error: null,
            hasHydrated: true,
          });
          await useAuthStore.persist.clearStorage();
        } finally {
          set({ isLoggingOut: false });
        }
      },

      hydrate: async () => {
        const { token, user, hasHydrated } = get();
        if (!hasHydrated) return;

        syncTokenToStorage(token);

        if (token && user) {
          if (getLastAccessTokenRefreshAt() === 0) {
            markAccessTokenRefreshed();
          }
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
          setSessionTokens(state.token, state.refreshToken ?? undefined);
          if (state.user) {
            state.isAuthenticated = true;
          }
        }
      },
    }
  )
);
