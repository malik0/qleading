import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";
import {
  SESSION_COOKIE_NAME,
  SESSION_EXPIRY_DAYS,
  generateRandomCredentials,
  generateSessionToken,
  hashPassword,
  verifyPassword,
} from "../../../lib/auth";
import { AccountResetPayload, UserState } from "../../../types/quran";

/**
 * Extracts session token from Cookie header or Authorization header.
 */
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
 * Creates an HTTP-only Set-Cookie header for the session token.
 */
function createSessionCookie(token: string, maxAgeDays = SESSION_EXPIRY_DAYS): string {
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax; Secure`;
}

/**
 * Clears the session cookie.
 */
function createClearCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
}

/**
 * Converts a D1 user_state row to a typed UserState object.
 */
function rowToUserState(row: any, user: { id: string; username: string; email: string }): UserState {
  let historyRecords = {};
  let userLogs = [];
  let settings: any = {};

  try {
    historyRecords = JSON.parse(row?.history_records_json || "{}");
  } catch {}
  try {
    userLogs = JSON.parse(row?.user_logs_json || "[]");
  } catch {}
  try {
    settings = JSON.parse(row?.settings_json || "{}");
  } catch {}

  return {
    userId: user.id,
    userName: user.username,
    userEmail: user.email,
    isLoggedIn: true,
    currentJuzId: row?.current_juz_id ?? 1,
    playbackPositionSeconds: row?.playback_position_seconds ?? 0,
    timerSeconds: row?.timer_seconds ?? 1800,
    timerTargetMinutes: row?.timer_target_minutes ?? 30,
    lastActiveDate: row?.last_active_date || new Date().toISOString().split("T")[0],
    updatedAt: row?.updated_at || new Date().toISOString(),
    historyRecords,
    userLogs,
    activeDeviceId: row?.active_device_id || undefined,
    isPlaying: Boolean(row?.is_playing),
    completedJuzs: settings.completedJuzs || [],
    juzTally: settings.juzTally || 0,
    khatmPlan: settings.khatmPlan || null,
  };
}

// GET: Current user session lookup (/api/auth?action=me)
export async function GET(req: Request) {
  try {
    const db = await getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const token = getSessionToken(req);
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify session
    const session = await db
      .prepare(
        "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
      )
      .bind(token)
      .first<{ token: string; user_id: string; expires_at: string }>();

    if (!session) {
      const res = NextResponse.json({ authenticated: false }, { status: 401 });
      res.headers.set("Set-Cookie", createClearCookie());
      return res;
    }

    // Fetch user
    const user = await db
      .prepare("SELECT id, username, email, created_at FROM users WHERE id = ?")
      .bind(session.user_id)
      .first<{ id: string; username: string; email: string; created_at: string }>();

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Fetch state
    const stateRow = await db
      .prepare("SELECT * FROM user_state WHERE user_id = ?")
      .bind(user.id)
      .first<any>();

    const userState = rowToUserState(stateRow, user);

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
      },
      state: userState,
    });
  } catch (error: any) {
    console.error("Auth GET error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate session", details: error.message },
      { status: 500 }
    );
  }
}

// POST: Handles login, register, random account generation, account reset, and logout
export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "login";
    const db = await getDb();

    if (!db) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    // 1. ACTION: LOGOUT
    if (action === "logout") {
      const token = getSessionToken(req);
      if (token) {
        await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
      }
      const response = NextResponse.json({ success: true, message: "Logged out" });
      response.headers.set("Set-Cookie", createClearCookie());
      return response;
    }

    const body = await req.json().catch(() => ({}));

    // 2. ACTION: RANDOM ACCOUNT GENERATION
    if (action === "random") {
      const creds = generateRandomCredentials();
      const userId = "usr_" + generateSessionToken().substring(0, 16);
      const { hash, salt } = await hashPassword(creds.password);
      const nowIso = new Date().toISOString();

      // Insert User
      await db
        .prepare(
          "INSERT INTO users (id, username, email, password_hash, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(userId, creds.username, creds.email, hash, salt, nowIso, nowIso)
        .run();

      // Insert initial user state (preserving current client progress if provided)
      const clientState: Partial<UserState> = body.state || {};
      const historyJson = JSON.stringify(clientState.historyRecords || {});
      const logsJson = JSON.stringify(clientState.userLogs || []);
      const settingsJson = JSON.stringify(body.settings || {});

      await db
        .prepare(`
          INSERT INTO user_state (
            user_id, current_juz_id, playback_position_seconds, timer_seconds,
            timer_target_minutes, last_active_date, history_records_json,
            user_logs_json, settings_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          userId,
          clientState.currentJuzId || 1,
          clientState.playbackPositionSeconds || 0,
          clientState.timerSeconds || 1800,
          clientState.timerTargetMinutes || 30,
          clientState.lastActiveDate || nowIso.split("T")[0],
          historyJson,
          logsJson,
          settingsJson,
          nowIso
        )
        .run();

      // Create session
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 86400 * 1000).toISOString();
      await db
        .prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
        .bind(token, userId, nowIso, expiresAt)
        .run();

      const userState: UserState = {
        userId,
        userName: creds.username,
        userEmail: creds.email,
        isLoggedIn: true,
        currentJuzId: clientState.currentJuzId || 1,
        playbackPositionSeconds: clientState.playbackPositionSeconds || 0,
        timerSeconds: clientState.timerSeconds || 1800,
        timerTargetMinutes: clientState.timerTargetMinutes || 30,
        lastActiveDate: clientState.lastActiveDate || nowIso.split("T")[0],
        updatedAt: nowIso,
        historyRecords: clientState.historyRecords || {},
        userLogs: clientState.userLogs || [],
      };

      const res = NextResponse.json({
        success: true,
        user: {
          id: userId,
          username: creds.username,
          email: creds.email,
          createdAt: nowIso,
        },
        randomCredentials: creds,
        token,
        state: userState,
        message: "Random account generated and authenticated",
      });

      res.headers.set("Set-Cookie", createSessionCookie(token));
      return res;
    }

    // 3. ACTION: REGISTER (Manual or pre-filled)
    if (action === "register") {
      const { username, email, password } = body;

      if (!email || !password || !email.includes("@")) {
        return NextResponse.json(
          { error: "Valid email and password required" },
          { status: 400 }
        );
      }

      // Check existing email
      const existing = await db
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(email.toLowerCase().trim())
        .first();

      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 409 }
        );
      }

      const userId = "usr_" + generateSessionToken().substring(0, 16);
      const cleanUsername = username?.trim() || email.split("@")[0];
      const { hash, salt } = await hashPassword(password);
      const nowIso = new Date().toISOString();

      await db
        .prepare(
          "INSERT INTO users (id, username, email, password_hash, salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(userId, cleanUsername, email.toLowerCase().trim(), hash, salt, nowIso, nowIso)
        .run();

      // State persistence
      const clientState: Partial<UserState> = body.state || {};
      const historyJson = JSON.stringify(clientState.historyRecords || {});
      const logsJson = JSON.stringify(clientState.userLogs || []);
      const settingsJson = JSON.stringify(body.settings || {});

      await db
        .prepare(`
          INSERT INTO user_state (
            user_id, current_juz_id, playback_position_seconds, timer_seconds,
            timer_target_minutes, last_active_date, history_records_json,
            user_logs_json, settings_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          userId,
          clientState.currentJuzId || 1,
          clientState.playbackPositionSeconds || 0,
          clientState.timerSeconds || 1800,
          clientState.timerTargetMinutes || 30,
          clientState.lastActiveDate || nowIso.split("T")[0],
          historyJson,
          logsJson,
          settingsJson,
          nowIso
        )
        .run();

      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 86400 * 1000).toISOString();
      await db
        .prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
        .bind(token, userId, nowIso, expiresAt)
        .run();

      const userState: UserState = {
        userId,
        userName: cleanUsername,
        userEmail: email.toLowerCase().trim(),
        isLoggedIn: true,
        currentJuzId: clientState.currentJuzId || 1,
        playbackPositionSeconds: clientState.playbackPositionSeconds || 0,
        timerSeconds: clientState.timerSeconds || 1800,
        timerTargetMinutes: clientState.timerTargetMinutes || 30,
        lastActiveDate: clientState.lastActiveDate || nowIso.split("T")[0],
        updatedAt: nowIso,
        historyRecords: clientState.historyRecords || {},
        userLogs: clientState.userLogs || [],
      };

      const res = NextResponse.json({
        success: true,
        user: { id: userId, username: cleanUsername, email: email.toLowerCase().trim(), createdAt: nowIso },
        token,
        state: userState,
      });

      res.headers.set("Set-Cookie", createSessionCookie(token));
      return res;
    }

    // 4. ACTION: LOGIN
    if (action === "login") {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const user = await db
        .prepare("SELECT * FROM users WHERE email = ?")
        .bind(email.toLowerCase().trim())
        .first<any>();

      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const isValid = await verifyPassword(password, user.salt, user.password_hash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const nowIso = new Date().toISOString();
      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 86400 * 1000).toISOString();

      await db
        .prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
        .bind(token, user.id, nowIso, expiresAt)
        .run();

      const stateRow = await db
        .prepare("SELECT * FROM user_state WHERE user_id = ?")
        .bind(user.id)
        .first<any>();

      const userState = rowToUserState(stateRow, user);

      const res = NextResponse.json({
        success: true,
        user: { id: user.id, username: user.username, email: user.email, createdAt: user.created_at },
        token,
        state: userState,
      });

      res.headers.set("Set-Cookie", createSessionCookie(token));
      return res;
    }

    // 5. ACTION: RESET ACCOUNT DETAILS (Logged In Users)
    if (action === "reset") {
      const token = getSessionToken(req);
      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const session = await db
        .prepare("SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')")
        .bind(token)
        .first<{ user_id: string }>();

      if (!session) {
        return NextResponse.json({ error: "Session expired or invalid" }, { status: 401 });
      }

      const user = await db
        .prepare("SELECT * FROM users WHERE id = ?")
        .bind(session.user_id)
        .first<any>();

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const payload: AccountResetPayload = body;
      const nowIso = new Date().toISOString();
      let updatedUsername = user.username;
      let updatedEmail = user.email;

      // Option A: Re-randomize identity
      if (payload.randomizeIdentity) {
        const randCreds = generateRandomCredentials();
        updatedUsername = randCreds.username;
        updatedEmail = randCreds.email;
        await db
          .prepare("UPDATE users SET username = ?, email = ?, updated_at = ? WHERE id = ?")
          .bind(updatedUsername, updatedEmail, nowIso, user.id)
          .run();
      } else {
        // Option B: Manual username / email update
        if (payload.username && payload.username.trim()) {
          updatedUsername = payload.username.trim();
        }

        if (payload.email && payload.email.trim() && payload.email !== user.email) {
          const emailCheck = await db
            .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
            .bind(payload.email.toLowerCase().trim(), user.id)
            .first();

          if (emailCheck) {
            return NextResponse.json({ error: "Email is already taken by another account" }, { status: 409 });
          }
          updatedEmail = payload.email.toLowerCase().trim();
        }

        await db
          .prepare("UPDATE users SET username = ?, email = ?, updated_at = ? WHERE id = ?")
          .bind(updatedUsername, updatedEmail, nowIso, user.id)
          .run();
      }

      // Password update
      if (payload.newPassword && payload.newPassword.trim()) {
        if (payload.currentPassword) {
          const isCurrentValid = await verifyPassword(payload.currentPassword, user.salt, user.password_hash);
          if (!isCurrentValid) {
            return NextResponse.json({ error: "Current password does not match" }, { status: 400 });
          }
        }
        const { hash, salt } = await hashPassword(payload.newPassword.trim());
        await db
          .prepare("UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?")
          .bind(hash, salt, nowIso, user.id)
          .run();
      }

      // Reset Reading Data if requested
      if (payload.resetReadingData) {
        await db
          .prepare(`
            UPDATE user_state SET
              current_juz_id = 1,
              playback_position_seconds = 0,
              timer_seconds = 1800,
              history_records_json = '{}',
              user_logs_json = '[]',
              updated_at = ?
            WHERE user_id = ?
          `)
          .bind(nowIso, user.id)
          .run();
      }

      const freshStateRow = await db
        .prepare("SELECT * FROM user_state WHERE user_id = ?")
        .bind(user.id)
        .first<any>();

      const freshUserState = rowToUserState(freshStateRow, {
        id: user.id,
        username: updatedUsername,
        email: updatedEmail,
      });

      return NextResponse.json({
        success: true,
        message: "Account details successfully updated",
        user: { id: user.id, username: updatedUsername, email: updatedEmail, createdAt: user.created_at },
        state: freshUserState,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Auth POST error:", error);
    return NextResponse.json(
      { error: "Authentication action failed", details: error.message },
      { status: 500 }
    );
  }
}

