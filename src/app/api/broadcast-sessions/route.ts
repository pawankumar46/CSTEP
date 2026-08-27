import { NextRequest, NextResponse } from "next/server";
import {
  createBackendBroadcastSession,
  fetchBackendBroadcastSessions,
  fetchBackendBroadcastSessionsForEvents,
  toBroadcastSessionSummary,
} from "@/lib/broadcast-server";
import { extractApiErrorMessage } from "@/lib/auth-mappers";
import type { CreateBroadcastSessionPayload } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");
    const eventId = request.nextUrl.searchParams.get("eventId")?.trim();
    const eventIdsParam = request.nextUrl.searchParams.get("eventIds")?.trim();

    if (eventId) {
      const sessions = await fetchBackendBroadcastSessions(authorization, eventId);
      return NextResponse.json(sessions.map(toBroadcastSessionSummary));
    }

    if (eventIdsParam) {
      const eventIds = eventIdsParam.split(",").map((id) => id.trim()).filter(Boolean);
      const sessions = await fetchBackendBroadcastSessionsForEvents(authorization, eventIds);
      return NextResponse.json(sessions.map(toBroadcastSessionSummary));
    }

    return NextResponse.json(
      { message: "eventId or eventIds query parameter is required" },
      { status: 400 },
    );
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
    const sessions = await fetchBackendBroadcastSessions(authorization, body.eventId);
    return NextResponse.json(sessions.map(toBroadcastSessionSummary));
  } catch (error) {
    return NextResponse.json(
      { message: extractApiErrorMessage(error) },
      { status: 500 },
    );
  }
}
