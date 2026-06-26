import { getAccessToken } from "@/lib/auth-session";
import type { BroadcastSessionSummary, CreateBroadcastSessionPayload, BroadcastUrlTarget } from "@/types";

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export const getBroadcastSessions = async (): Promise<BroadcastSessionSummary[]> => {
  const response = await fetch("/api/broadcast-sessions", {
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<BroadcastSessionSummary[]>;
};

export const createBroadcastSession = async (
  payload: CreateBroadcastSessionPayload,
): Promise<BroadcastSessionSummary[]> => {
  const response = await fetch("/api/broadcast-sessions", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<BroadcastSessionSummary[]>;
};

export const fetchBroadcastUrl = async (
  sessionId: string,
  target: BroadcastUrlTarget,
): Promise<string> => {
  const response = await fetch(
    `/api/broadcast-sessions/${encodeURIComponent(sessionId)}/url?target=${encodeURIComponent(target)}`,
    { headers: authHeaders(), cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) throw new Error("URL not returned");
  return data.url;
};
