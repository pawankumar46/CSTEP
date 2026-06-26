import { NextRequest, NextResponse } from "next/server";
import {
  createBackendBroadcastSession,
  fetchBackendBroadcastSessions,
  toBroadcastSessionSummary,
} from "@/lib/broadcast-server";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import type { CreateBroadcastSessionPayload } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const sessions = await fetchBackendBroadcastSessions(authorization);
    return NextResponse.json(sessions.map(toBroadcastSessionSummary));
  } catch (error) {
    return NextResponse.json(
      { message: extractApiErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const body = (await request.json()) as CreateBroadcastSessionPayload;

    if (!body.eventId || !body.broadcasterId || !body.name?.trim()) {
      return NextResponse.json({ message: "Invalid broadcast session payload" }, { status: 400 });
    }

    await createBackendBroadcastSession(authorization, body);
    const sessions = await fetchBackendBroadcastSessions(authorization);
    return NextResponse.json(sessions.map(toBroadcastSessionSummary));
  } catch (error) {
    return NextResponse.json(
      { message: extractApiErrorMessage(error) },
      { status: 500 },
    );
  }
}
