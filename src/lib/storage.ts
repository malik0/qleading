import { AppSettings, DayReadingRecord, UserLogEntry, UserState } from "../types/quran";
import { getLocalDateString } from "./utils";

const STATE_KEY = "qleading_state_v1";
const SETTINGS_KEY = "qleading_settings_v1";
const DEVICE_ID_KEY = "qleading_device_id_v1";

export function getDeviceId(): string {
  if (typeof window === "undefined") return "srv_device";
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = "dev_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "temp_device_" + Math.random().toString(36).substring(2, 8);
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  rewindStepSeconds: 15,
  forwardStepSeconds: 15,
  timerTargetMinutes: 30,
  streakTargetMinutes: 30,
  autoTimerDurationMinutes: 30,
  timerMode: "countdown",
  streakStartDay: 1, // Monday
  preferLocalAudio: false,
  themeMode: "dark",
  themeColor: "sky",
  defaultPlaybackSpeed: 1.0,
  customJuzNames: {},
  customJuzRanges: {},
};

export const INITIAL_USER_STATE: UserState = {
  userId: "guest_" + Math.random().toString(36).substring(2, 9),
  userName: "Guest User",
  userEmail: "",
  isLoggedIn: false,
  currentJuzId: 1,
  playbackPositionSeconds: 0,
  timerSeconds: 1800, // 30 minutes default
  timerTargetMinutes: 30,
  streakTargetMinutes: 30,
  lastActiveDate: getLocalDateString(),
  updatedAt: new Date().toISOString(),
  historyRecords: {},
  userLogs: [],
  isPlaying: false,
  completedJuzs: [],
  juzTally: 0,
};

export function getStoredSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      streakTargetMinutes: parsed.streakTargetMinutes ?? parsed.timerTargetMinutes ?? DEFAULT_SETTINGS.streakTargetMinutes,
      autoTimerDurationMinutes: parsed.autoTimerDurationMinutes ?? parsed.timerTargetMinutes ?? DEFAULT_SETTINGS.autoTimerDurationMinutes,
      ...parsed,
    };
  } catch (e) {
    console.error("Failed to load settings from storage:", e);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings to storage:", e);
  }
}

export function getStoredState(): UserState {
  if (typeof window === "undefined") return INITIAL_USER_STATE;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return INITIAL_USER_STATE;
    const parsed = JSON.parse(raw);
    const completedJuzs = parsed.completedJuzs || [];
    return {
      ...INITIAL_USER_STATE,
      streakTargetMinutes: parsed.streakTargetMinutes ?? parsed.timerTargetMinutes ?? INITIAL_USER_STATE.streakTargetMinutes,
      completedJuzs,
      juzTally: parsed.juzTally ?? completedJuzs.length,
      ...parsed,
    };
  } catch (e) {
    console.error("Failed to load state from storage:", e);
    return INITIAL_USER_STATE;
  }
}

export function saveStoredState(state: UserState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state to storage:", e);
  }
}

/**
 * Reconcile local and remote states based on requirement 0.4:
 * "The user should seamlessly play the audio from various devices and everything should be in synch.
 * Compare the timestamps and go with the most recent."
 */
export function reconcileStates(local: UserState, remote: UserState): UserState {
  const localTime = new Date(local.updatedAt || 0).getTime();
  const remoteTime = new Date(remote.updatedAt || 0).getTime();

  // If one state is authenticated and the other is a guest, the authenticated account always defines the identity
  const authIdentity = remote.isLoggedIn
    ? {
        userId: remote.userId,
        userName: remote.userName,
        userEmail: remote.userEmail,
        isLoggedIn: true,
      }
    : local.isLoggedIn
    ? {
        userId: local.userId,
        userName: local.userName,
        userEmail: local.userEmail,
        isLoggedIn: true,
      }
    : {
        userId: local.userId,
        userName: local.userName,
        userEmail: local.userEmail,
        isLoggedIn: false,
      };

  // If one device is actively playing and the other is idle/paused, prioritize the playing device
  let base: UserState;
  if (remote.isPlaying && !local.isPlaying) {
    base = remote;
  } else if (local.isPlaying && !remote.isPlaying) {
    base = local;
  } else if (remote.isLoggedIn && !local.isLoggedIn) {
    // When syncing a logged-in account into a guest session, adopt the remote account state
    base = remote;
  } else {
    // Determine which state has the most recent position/timer
    base = remoteTime > localTime ? remote : local;
  }

  // Merge history records and user logs so data from either device is preserved
  const mergedHistory: Record<string, DayReadingRecord> = {
    ...local.historyRecords,
    ...remote.historyRecords,
  };

  // Combine day slots for matching days
  for (const date in local.historyRecords) {
    if (remote.historyRecords[date]) {
      const locDay = local.historyRecords[date];
      const remDay = remote.historyRecords[date];
      const combinedSlots: Record<number, number> = { ...locDay.slots };
      for (const slot in remDay.slots) {
        const sNum = Number(slot);
        combinedSlots[sNum] = Math.max(combinedSlots[sNum] || 0, remDay.slots[sNum] || 0);
      }
      const combinedCompletedJuzIds = Array.from(
        new Set([
          ...(locDay.completedJuzIds || []),
          ...(remDay.completedJuzIds || []),
        ])
      );
      const combinedJuzCompletedCount = Math.max(
        locDay.juzCompletedCount || 0,
        remDay.juzCompletedCount || 0,
        combinedCompletedJuzIds.length
      );

      mergedHistory[date] = {
        date,
        secondsRead: Math.max(locDay.secondsRead, remDay.secondsRead),
        targetReached: locDay.targetReached || remDay.targetReached || combinedJuzCompletedCount > 0,
        slots: combinedSlots,
        juzCompletedCount: combinedJuzCompletedCount,
        completedJuzIds: combinedCompletedJuzIds,
      };
    }
  }

  // Deduplicate user logs by ID
  const logMap = new Map<string, UserLogEntry>();
  (local.userLogs || []).forEach((log) => logMap.set(log.id, log));
  (remote.userLogs || []).forEach((log) => logMap.set(log.id, log));
  const mergedLogs = Array.from(logMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Merge completed Juzs (union of distinct IDs 1-30)
  const mergedCompletedJuzs = Array.from(
    new Set([...(local.completedJuzs || []), ...(remote.completedJuzs || [])])
  ).sort((a, b) => a - b);

  const mergedTally = Math.max(
    local.juzTally || 0,
    remote.juzTally || 0,
    mergedCompletedJuzs.length
  );

  return {
    ...base,
    ...authIdentity,
    historyRecords: mergedHistory,
    userLogs: mergedLogs,
    completedJuzs: mergedCompletedJuzs,
    juzTally: mergedTally,
  };
}

