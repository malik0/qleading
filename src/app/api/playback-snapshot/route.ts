import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

function getSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";").map((value) => value.trim())) {
    if (cookie.startsWith(`${SESSION_COOKIE_NAME}=`)) {
      return decodeURIComponent(cookie.substring(SESSION_COOKIE_NAME.length + 1));
    }
  }
  return null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Stores only the current playback checkpoint. This endpoint is intentionally
 * small so it can be sent with fetch({ keepalive: true }) as a document is
 * being hidden or terminated on mobile.
 */
export async function POST(req: Request) {
  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 });
    }

    const token = getSessionToken(req);
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const session = await db
      .prepare("SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')")
      .bind(token)
      .first<{ user_id: string }>();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body: unknown = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid playback snapshot" }, { status: 400 });
    }
    const snapshot = body as Record<string, unknown>;
    const juzId = snapshot.juzId;
    const position = snapshot.playbackPositionSeconds;
    const timerSeconds = snapshot.timerSeconds;
    const updatedAt = snapshot.updatedAt;

    if (
      !isFiniteNumber(juzId) ||
      juzId < 1 ||
      juzId > 30 ||
      !isFiniteNumber(position) ||
      position < 0 ||
      !isFiniteNumber(timerSeconds) ||
      typeof updatedAt !== "string" ||
      !Number.isFinite(new Date(updatedAt).getTime())
    ) {
      return NextResponse.json({ error: "Invalid playback snapshot" }, { status: 400 });
    }

    // ISO timestamps sort lexically. Do not permit an older hidden-page event
    // to overwrite a newer heartbeat, pause, or user action.
    await db
      .prepare(`
        UPDATE user_state
        SET current_juz_id = ?, playback_position_seconds = ?, timer_seconds = ?,
            updated_at = ?, active_device_id = ?, is_playing = ?
        WHERE user_id = ? AND updated_at <= ?
      `)
      .bind(
        Math.round(juzId),
        position,
        timerSeconds,
        updatedAt,
        typeof snapshot.deviceId === "string" ? snapshot.deviceId : null,
        snapshot.isPlaying ? 1 : 0,
        session.user_id,
        updatedAt
      )
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn("Playback snapshot failed:", error);
    return NextResponse.json({ error: "Could not save playback snapshot" }, { status: 500 });
  }
}
