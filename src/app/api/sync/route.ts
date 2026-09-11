import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import { SESSION_COOKIE_NAME } from "../../../lib/auth";
import { DayReadingRecord, UserLogEntry, UserState } from "../../../types/quran";

function getSessionToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith(`${SESSION_COOKIE_NAME}=`)) {
        return decodeURIComponent(c.substring(SESSION_COOKIE_NAME.length + 1));
      }
    }
  }
  return null;
}

/**
 * Merges client and server history records cleanly
 */
function mergeHistoryRecords(
  local: Record<string, DayReadingRecord> = {},
  remote: Record<string, DayReadingRecord> = {},
  isClientNewer: boolean = true
): Record<string, DayReadingRecord> {
  const merged: Record<string, DayReadingRecord> = { ...remote, ...local };

  for (const date in remote) {
    if (local[date]) {
      const locDay = local[date];
      const remDay = remote[date];
      const combinedSlots: Record<number, number> = { ...(remDay.slots || {}) };

      for (const slot in locDay.slots || {}) {
        const sNum = Number(slot);
        combinedSlots[sNum] = Math.max(combinedSlots[sNum] || 0, locDay.slots[sNum] || 0);
      }

      const combinedCompletedJuzIds =
        isClientNewer && locDay.completedJuzIds !== undefined
          ? locDay.completedJuzIds
          : Array.from(
              new Set([
                ...(locDay.completedJuzIds || []),
                ...(remDay.completedJuzIds || []),
              ])
            );
      const combinedJuzCompletedCount =
        isClientNewer && locDay.juzCompletedCount !== undefined
          ? locDay.juzCompletedCount
          : Math.max(
              locDay.juzCompletedCount || 0,
              remDay.juzCompletedCount || 0,
              combinedCompletedJuzIds.length
            );

      merged[date] = {
        date,
        secondsRead: Math.max(locDay.secondsRead || 0, remDay.secondsRead || 0),
        targetReached: Boolean(locDay.targetReached || remDay.targetReached || combinedJuzCompletedCount > 0),
        slots: combinedSlots,
        juzCompletedCount: combinedJuzCompletedCount,
        completedJuzIds: combinedCompletedJuzIds,
      };
    }
  }
  return merged;
}

/**
 * Deduplicates and sorts user reading logs chronologically
 */
function mergeUserLogs(
  localLogs: UserLogEntry[] = [],
  remoteLogs: UserLogEntry[] = []
): UserLogEntry[] {
  const map = new Map<string, UserLogEntry>();
  (remoteLogs || []).forEach((l) => map.set(l.id, l));
  (localLogs || []).forEach((l) => map.set(l.id, l));
  return Array.from(map.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 500);
}

export async function POST(req: Request) {
  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const clientState: UserState = body.state;
    const clientDeviceId: string | undefined = body.deviceId || clientState?.activeDeviceId;
    const isStartingPlayback: boolean = Boolean(body.isStartingPlayback || body.action === "claim_playback");
    const clientIsPlaying: boolean =
      body.isPlaying !== undefined ? Boolean(body.isPlaying) : Boolean(clientState?.isPlaying);

    if (!clientState || !clientState.userId) {
      return NextResponse.json({ error: "Invalid state payload" }, { status: 400 });
    }

    // Determine target userId: from session token if available, or clientState.userId
    let targetUserId = clientState.userId;
    const token = getSessionToken(req);
    if (token) {
      const session = await db
        .prepare("SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')")
        .bind(token)
        .first<{ user_id: string }>();
      if (session) {
        targetUserId = session.user_id;
      }
    }

    // Fetch existing server state from Cloudflare D1
    const existingRow = await db
      .prepare("SELECT * FROM user_state WHERE user_id = ?")
      .bind(targetUserId)
      .first<any>();

    const nowIso = new Date().toISOString();

    if (!existingRow) {
      // First time save into Cloudflare D1
      const historyJson = JSON.stringify(clientState.historyRecords || {});
      const logsJson = JSON.stringify(clientState.userLogs || []);
      const settingsPayload = {
        ...(body.settings || {}),
        completedJuzs: clientState.completedJuzs || [],
        juzTally: clientState.juzTally || 0,
        khatmPlan: clientState.khatmPlan || body.settings?.khatmPlan || null,
        syncPoints: clientState.syncPoints || [],
      };
      const settingsJson = JSON.stringify(settingsPayload);

      await db
        .prepare(`
          INSERT INTO user_state (
            user_id, current_juz_id, playback_position_seconds, timer_seconds,
            timer_target_minutes, last_active_date, history_records_json,
            user_logs_json, settings_json, updated_at, active_device_id, is_playing
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          targetUserId,
          clientState.currentJuzId || 1,
          clientState.playbackPositionSeconds || 0,
          clientState.timerSeconds || 1800,
          clientState.timerTargetMinutes || 30,
          clientState.lastActiveDate || nowIso.split("T")[0],
          historyJson,
          logsJson,
          settingsJson,
          clientState.updatedAt || nowIso,
          clientDeviceId || null,
          clientIsPlaying ? 1 : 0
        )
        .run();

      return NextResponse.json({
        success: true,
        message: "State stored in Cloudflare D1",
        remoteState: {
          ...clientState,
          activeDeviceId: clientDeviceId,
          isPlaying: clientIsPlaying,
        },
        settings: settingsPayload,
      });
    }

    // Existing state exists in D1: Reconcile based on device state and timestamp
    let existingHistory: Record<string, DayReadingRecord> = {};
    let existingLogs: UserLogEntry[] = [];
    try {
      existingHistory = JSON.parse(existingRow.history_records_json || "{}");
    } catch {}
    try {
      existingLogs = JSON.parse(existingRow.user_logs_json || "[]");
    } catch {}

    const clientTime = new Date(clientState.updatedAt || 0).getTime();
    const serverUpdatedAtMs = new Date(existingRow.updated_at || 0).getTime();
    const nowMs = Date.now();
    const serverActiveDeviceId = existingRow.active_device_id;
    const serverIsPlaying = Boolean(existingRow.is_playing);
    // Active playback lease is considered live if updated in the last 60 seconds
    const isServerPlaybackActive = serverIsPlaying && (nowMs - serverUpdatedAtMs < 60000);

    const isClientNewer = clientTime >= serverUpdatedAtMs;
    const mergedHistory = mergeHistoryRecords(clientState.historyRecords, existingHistory, isClientNewer);
    const mergedLogs = mergeUserLogs(clientState.userLogs, existingLogs);

    let resolvedJuzId: number;
    let resolvedPosition: number;
    let resolvedTimerSeconds: number;
    let resolvedTargetMinutes: number;
    let resolvedLastActive: string;
    let resolvedUpdatedAt: string;
    let resolvedActiveDeviceId: string | null = serverActiveDeviceId;
    let resolvedIsPlaying: number = existingRow.is_playing || 0;

    const isExplicitSync: boolean = body.action === "sync" || body.action === "manualSync";

    if (isStartingPlayback) {
      // 1. User clicked Play: Claim active playback lease for clientDeviceId
      resolvedActiveDeviceId = clientDeviceId || null;
      resolvedIsPlaying = 1;
      resolvedUpdatedAt = nowIso;

      // If server has saved progress, adopt the cloud's playback position and track so user picks up where left off
      // Only adopt server position if server timestamp is newer than client timestamp and client has no intentional track state
      const isClientFresh = (clientState.playbackPositionSeconds || 0) === 0 && (!clientState.currentJuzId || clientState.currentJuzId === 1);
      const isServerNewer = serverUpdatedAtMs > clientTime;
      if (
        (existingRow.playback_position_seconds > 0 || (existingRow.current_juz_id && existingRow.current_juz_id > 1)) &&
        ((isClientFresh && serverUpdatedAtMs >= clientTime) || (serverActiveDeviceId !== clientDeviceId && isServerNewer))
      ) {
        resolvedJuzId = existingRow.current_juz_id || 1;
        resolvedPosition = existingRow.playback_position_seconds || 0;
        resolvedTimerSeconds = existingRow.timer_seconds || 1800;
        resolvedTargetMinutes = existingRow.timer_target_minutes || 30;
        resolvedLastActive = existingRow.last_active_date;
      } else {
        resolvedJuzId = clientState.currentJuzId || existingRow.current_juz_id || 1;
        resolvedPosition = clientState.playbackPositionSeconds ?? existingRow.playback_position_seconds ?? 0;
        resolvedTimerSeconds = clientState.timerSeconds ?? existingRow.timer_seconds ?? 1800;
        resolvedTargetMinutes = clientState.timerTargetMinutes ?? existingRow.timer_target_minutes ?? 30;
        resolvedLastActive = clientState.lastActiveDate || existingRow.last_active_date;
      }
    } else if (isExplicitSync) {
      // 2. User clicked Sync button: Behave EXACTLY like Play button's pre-playback sync!
      // Synchronize with the cloud's authoritative track, position, timer, and active date from D1
      resolvedJuzId = existingRow.current_juz_id || clientState.currentJuzId || 1;
      resolvedPosition = existingRow.playback_position_seconds ?? clientState.playbackPositionSeconds ?? 0;
      resolvedTimerSeconds = existingRow.timer_seconds ?? clientState.timerSeconds ?? 1800;
      resolvedTargetMinutes = existingRow.timer_target_minutes ?? clientState.timerTargetMinutes ?? 30;
      resolvedLastActive = existingRow.last_active_date || clientState.lastActiveDate;
      resolvedUpdatedAt = existingRow.updated_at || nowIso;
      resolvedIsPlaying = existingRow.is_playing || 0;
    } else if (
      isServerPlaybackActive &&
      clientDeviceId &&
      serverActiveDeviceId &&
      clientDeviceId !== serverActiveDeviceId &&
      !clientIsPlaying
    ) {
      // 3. Another device is actively playing!
      // Stale idle/paused background sync from this device MUST NOT overwrite active playback.
      // Merge history and logs, but preserve active device's playback position and track.
      resolvedJuzId = existingRow.current_juz_id || 1;
      resolvedPosition = existingRow.playback_position_seconds || 0;
      resolvedTimerSeconds = existingRow.timer_seconds || 1800;
      resolvedTargetMinutes = existingRow.timer_target_minutes || 30;
      resolvedLastActive = existingRow.last_active_date;
      resolvedUpdatedAt = existingRow.updated_at;
      resolvedActiveDeviceId = serverActiveDeviceId;
      resolvedIsPlaying = 1;
    } else if (clientIsPlaying) {
      // 4. This device is actively playing (periodic progress sync)
      resolvedActiveDeviceId = clientDeviceId || null;
      resolvedIsPlaying = 1;
      resolvedUpdatedAt = nowIso;
      resolvedJuzId = clientState.currentJuzId || existingRow.current_juz_id || 1;
      resolvedPosition = clientState.playbackPositionSeconds ?? existingRow.playback_position_seconds ?? 0;
      resolvedTimerSeconds = clientState.timerSeconds ?? existingRow.timer_seconds ?? 1800;
      resolvedTargetMinutes = clientState.timerTargetMinutes ?? existingRow.timer_target_minutes ?? 30;
      resolvedLastActive = clientState.lastActiveDate || existingRow.last_active_date;
    } else {
      // 5. Normal paused or idle sync
      if (body.action === "pause" || clientIsPlaying === false) {
        if (!serverActiveDeviceId || serverActiveDeviceId === clientDeviceId) {
          resolvedIsPlaying = 0;
        }
      }

      if (clientTime >= serverUpdatedAtMs) {
        // Client is newer or equal
        resolvedJuzId = clientState.currentJuzId || existingRow.current_juz_id || 1;
        resolvedPosition = clientState.playbackPositionSeconds ?? existingRow.playback_position_seconds ?? 0;
        resolvedTimerSeconds = clientState.timerSeconds ?? existingRow.timer_seconds ?? 1800;
        resolvedTargetMinutes = clientState.timerTargetMinutes ?? existingRow.timer_target_minutes ?? 30;
        resolvedLastActive = clientState.lastActiveDate || existingRow.last_active_date;
        resolvedUpdatedAt = clientState.updatedAt || nowIso;
      } else {
        // Server is newer
        resolvedJuzId = existingRow.current_juz_id || 1;
        resolvedPosition = existingRow.playback_position_seconds || 0;
        resolvedTimerSeconds = existingRow.timer_seconds || 1800;
        resolvedTargetMinutes = existingRow.timer_target_minutes || 30;
        resolvedLastActive = existingRow.last_active_date;
        resolvedUpdatedAt = existingRow.updated_at;
      }
    }

    const mergedHistoryJson = JSON.stringify(mergedHistory);
    const mergedLogsJson = JSON.stringify(mergedLogs);
    let existingSettings: any = {};
    try {
      existingSettings = JSON.parse(existingRow.settings_json || "{}");
    } catch {}

    const resolvedCompletedJuzs =
      isClientNewer && clientState.completedJuzs !== undefined
        ? clientState.completedJuzs
        : Array.from(
            new Set([
              ...(clientState.completedJuzs || []),
              ...(existingSettings.completedJuzs || []),
            ])
          ).sort((a, b) => a - b);

    const resolvedJuzTally =
      isClientNewer && clientState.juzTally !== undefined
        ? clientState.juzTally
        : Math.max(
            clientState.juzTally || 0,
            existingSettings.juzTally || 0,
            resolvedCompletedJuzs.length
          );

    // Resolve khatmPlan: latest updatedAt wins
    const clientKhatm = clientState.khatmPlan || body.settings?.khatmPlan;
    const serverKhatm = existingSettings.khatmPlan;
    let resolvedKhatm = clientKhatm || serverKhatm || null;
    if (clientKhatm && serverKhatm) {
      const cTime = new Date(clientKhatm.updatedAt || 0).getTime();
      const sTime = new Date(serverKhatm.updatedAt || 0).getTime();
      resolvedKhatm = sTime >= cTime ? serverKhatm : clientKhatm;
    }

    // Merge syncPoints:
    const clientSyncPoints = clientState.syncPoints || [];
    const existingSyncPoints = existingSettings.syncPoints || [];
    const syncPointMap = new Map<string, any>();
    existingSyncPoints.forEach((sp: any) => syncPointMap.set(sp.id, sp));
    clientSyncPoints.forEach((sp: any) => syncPointMap.set(sp.id, sp));
    const resolvedSyncPoints = Array.from(syncPointMap.values())
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    // When explicitly syncing, D1 database settings take precedence over local device defaults.
    // When updating settings, the client's updated settings take precedence and update D1.
    const settingsPayload = isExplicitSync
      ? {
          ...(body.settings || {}),
          ...existingSettings,
          completedJuzs: resolvedCompletedJuzs,
          juzTally: resolvedJuzTally,
          khatmPlan: resolvedKhatm,
          syncPoints: resolvedSyncPoints,
        }
      : {
          ...existingSettings,
          ...(body.settings || {}),
          completedJuzs: resolvedCompletedJuzs,
          juzTally: resolvedJuzTally,
          khatmPlan: resolvedKhatm,
          syncPoints: resolvedSyncPoints,
        };
    const settingsJson = JSON.stringify(settingsPayload);

    // Save reconciled state into Cloudflare D1
    await db
      .prepare(`
        UPDATE user_state SET
          current_juz_id = ?,
          playback_position_seconds = ?,
          timer_seconds = ?,
          timer_target_minutes = ?,
          last_active_date = ?,
          history_records_json = ?,
          user_logs_json = ?,
          settings_json = ?,
          updated_at = ?,
          active_device_id = ?,
          is_playing = ?
        WHERE user_id = ?
      `)
      .bind(
        resolvedJuzId,
        resolvedPosition,
        resolvedTimerSeconds,
        resolvedTargetMinutes,
        resolvedLastActive,
        mergedHistoryJson,
        mergedLogsJson,
        settingsJson,
        resolvedUpdatedAt,
        resolvedActiveDeviceId,
        resolvedIsPlaying,
        targetUserId
      )
      .run();

    const resolvedState: UserState = {
      ...clientState,
      userId: targetUserId,
      currentJuzId: resolvedJuzId,
      playbackPositionSeconds: resolvedPosition,
      timerSeconds: resolvedTimerSeconds,
      timerTargetMinutes: resolvedTargetMinutes,
      lastActiveDate: resolvedLastActive,
      updatedAt: resolvedUpdatedAt,
      historyRecords: mergedHistory,
      userLogs: mergedLogs,
      activeDeviceId: resolvedActiveDeviceId || undefined,
      isPlaying: Boolean(resolvedIsPlaying),
      completedJuzs: resolvedCompletedJuzs,
      juzTally: resolvedJuzTally,
      khatmPlan: resolvedKhatm,
      syncPoints: resolvedSyncPoints,
    };

    return NextResponse.json({
      success: true,
      remoteState: resolvedState,
      settings: settingsPayload,
    });
  } catch (error: any) {
    console.error("Sync POST error:", error);
    return NextResponse.json(
      { error: "Internal sync error", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("userId");

    const token = getSessionToken(req);
    if (token) {
      const session = await db
        .prepare("SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime('now')")
        .bind(token)
        .first<{ user_id: string }>();
      if (session) {
        userId = session.user_id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "userId or session required" }, { status: 400 });
    }

    const row = await db
      .prepare("SELECT * FROM user_state WHERE user_id = ?")
      .bind(userId)
      .first<any>();

    if (!row) {
      return NextResponse.json({ error: "User state not found" }, { status: 404 });
    }

    const user = await db
      .prepare("SELECT username, email FROM users WHERE id = ?")
      .bind(userId)
      .first<{ username: string; email: string }>();

    let historyRecords = {};
    let userLogs = [];
    try {
      historyRecords = JSON.parse(row.history_records_json || "{}");
    } catch {}
    try {
      userLogs = JSON.parse(row.user_logs_json || "[]");
    } catch {}

    let parsedSettings: any = {};
    try {
      parsedSettings = JSON.parse(row.settings_json || "{}");
    } catch {}

    const state: UserState = {
      userId,
      userName: user?.username || "Reader",
      userEmail: user?.email || "",
      isLoggedIn: true,
      currentJuzId: row.current_juz_id,
      playbackPositionSeconds: row.playback_position_seconds,
      timerSeconds: row.timer_seconds,
      timerTargetMinutes: row.timer_target_minutes,
      lastActiveDate: row.last_active_date,
      updatedAt: row.updated_at,
      historyRecords,
      userLogs,
      activeDeviceId: row.active_device_id || undefined,
      isPlaying: Boolean(row.is_playing),
      completedJuzs: parsedSettings.completedJuzs || [],
      juzTally: parsedSettings.juzTally || 0,
      khatmPlan: parsedSettings.khatmPlan || null,
      syncPoints: parsedSettings.syncPoints || [],
    };

    return NextResponse.json({ success: true, state, settings: parsedSettings });
  } catch (error: any) {
    console.error("Sync GET error:", error);
    return NextResponse.json(
      { error: "Internal sync error", message: error.message },
      { status: 500 }
    );
  }
}
