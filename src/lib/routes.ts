export const ROUTES = {
  home: "/",
  signup: "/signup",
  login: "/login",
  otp: "/otp",
  eventRegister: "/event-register",
  streaming: "/streaming",
} as const;

export function getHomeRegisterHref(isAuthenticated: boolean, isEventRegistered: boolean): string {
  if (!isAuthenticated) return ROUTES.signup;
  if (!isEventRegistered) return ROUTES.eventRegister;
  return ROUTES.home;
}

export function getHomeRegisterLabel(isAuthenticated: boolean, isEventRegistered: boolean): string | null {
  if (!isAuthenticated) return "Register";
  if (!isEventRegistered) return "Register for Event";
  return null;
}
