import { NextResponse } from "next/server";
import { UserState } from "../../../types/quran";

// In-memory mock edge store for user profiles (in production Cloudflare KV or D1 can bind here)
const edgeUserStore: Map<string, UserState> = new Map();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientState: UserState = body.state;

    if (!clientState || !clientState.userId) {
      return NextResponse.json({ error: "Invalid state payload" }, { status: 400 });
    }

    const userId = clientState.userId;
    const existingServerState = edgeUserStore.get(userId);

    if (!existingServerState) {
      // First time sync for this user
      edgeUserStore.set(userId, clientState);
      return NextResponse.json({
        success: true,
        message: "State stored on server",
        remoteState: clientState,
      });
    }

    // Timestamp-based conflict resolution (Requirement 0.4: compare timestamps and go with most recent)
    const clientTime = new Date(clientState.updatedAt || 0).getTime();
    const serverTime = new Date(existingServerState.updatedAt || 0).getTime();

    let resolvedState: UserState;

    if (clientTime >= serverTime) {
      // Client is newer
      resolvedState = {
        ...clientState,
        historyRecords: {
          ...existingServerState.historyRecords,
          ...clientState.historyRecords,
        },
      };
      edgeUserStore.set(userId, resolvedState);
    } else {
      // Server is newer
      resolvedState = {
        ...existingServerState,
        historyRecords: {
          ...clientState.historyRecords,
          ...existingServerState.historyRecords,
        },
      };
    }

    return NextResponse.json({
      success: true,
      remoteState: resolvedState,
    });
  } catch (error: any) {
    console.error("Sync API error:", error);
    return NextResponse.json(
      { error: "Internal sync error", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId || !edgeUserStore.has(userId)) {
    return NextResponse.json({ error: "User state not found" }, { status: 404 });
  }

  return NextResponse.json({ state: edgeUserStore.get(userId) });
}

