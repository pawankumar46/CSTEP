import { NextRequest, NextResponse } from "next/server";
import {
  fetchBackendBroadcastSessions,
  isBroadcastUrlTarget,
  readBroadcastUrl,
} from "@/lib/broadcast-server";
import { extractApiErrorMessage } from "@/lib/auth-mappers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const target = request.nextUrl.searchParams.get("target");
    const eventId = request.nextUrl.searchParams.get("eventId")?.trim();

    if (!target || !isBroadcastUrlTarget(target)) {
      return NextResponse.json({ message: "Invalid URL target" }, { status: 400 });
    }

    if (!eventId) {
      return NextResponse.json({ message: "eventId query parameter is required" }, { status: 400 });
    }

    const authorization = request.headers.get("authorization");
    const sessions = await fetchBackendBroadcastSessions(authorization, eventId);
    const session = sessions.find((item) => item.id === id);

    if (!session) {
      return NextResponse.json({ message: "Broadcast session not found" }, { status: 404 });
    }

    const url = readBroadcastUrl(session, target);
    if (!url) {
      return NextResponse.json({ message: "URL not available" }, { status: 404 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { message: extractApiErrorMessage(error) },
      { status: 500 },
    );
  }
}
