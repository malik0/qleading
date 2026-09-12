import { AppSettings, DayReadingRecord, SyncPoint, UserLogEntry, UserState } from "../types/quran";
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
  preferLocalAudio: true,
  themeMode: "dark",
  themeColor: "sky",
  defaultPlaybackSpeed: 1.0,
  customJuzNames: {},
  customJuzRanges: {},
  khatmPlan: null,
  enableBackToTop: true,
  mushafScript: "uthmani",
  mushafArabicFont: "amiri-quran",
  mushafTranslationId: 20,
  mushafArabicFontSize: 28,
  mushafTranslationFontSize: 16,
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
  khatmPlan: null,
  syncPoints: [],
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

/**
 * Merges local and remote settings cleanly, with DEFAULT_SETTINGS as base fallback
 */
export function reconcileSettings(local: AppSettings, remote?: Partial<AppSettings> | null): AppSettings {
  if (!remote) return local;
  return {
    ...DEFAULT_SETTINGS,
    ...local,
    ...remote,
    customJuzNames: {
      ...(local.customJuzNames || {}),
      ...(remote.customJuzNames || {}),
    },
    customJuzRanges: {
      ...(local.customJuzRanges || {}),
      ...(remote.customJuzRanges || {}),
    },
    khatmPlan: remote.khatmPlan !== undefined ? remote.khatmPlan : local.khatmPlan,
  };
}

export function getStoredState(): UserState {
  if (typeof window === "undefined") return INITIAL_USER_STATE;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return INITIAL_USER_STATE;
    const parsed = JSON.parse(raw);
    const completedJuzs = parsed.completedJuzs || [];
    const syncPoints = parsed.syncPoints || [];
    return {
      ...INITIAL_USER_STATE,
      streakTargetMinutes: parsed.streakTargetMinutes ?? parsed.timerTargetMinutes ?? INITIAL_USER_STATE.streakTargetMinutes,
      completedJuzs,
      juzTally: parsed.juzTally ?? completedJuzs.length,
      syncPoints,
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
 * Merges local and remote DayReadingRecord dictionaries cleanly
 */
export function mergeHistoryRecords(
  local: Record<string, DayReadingRecord> = {},
  remote: Record<string, DayReadingRecord> = {},
  isLocalNewer: boolean = true
): Record<string, DayReadingRecord> {
  const mergedHistory: Record<string, DayReadingRecord> = {
    ...remote,
    ...local,
  };

  for (const date in local) {
    if (remote[date]) {
      const locDay = local[date];
      const remDay = remote[date];
      const combinedSlots: Record<number, number> = { ...(remDay.slots || {}) };
      for (const slot in locDay.slots || {}) {
        const sNum = Number(slot);
        combinedSlots[sNum] = Math.max(combinedSlots[sNum] || 0, locDay.slots[sNum] || 0);
      }
      const combinedCompletedJuzIds =
        isLocalNewer && locDay.completedJuzIds !== undefined
          ? locDay.completedJuzIds
          : Array.from(
              new Set([
                ...(locDay.completedJuzIds || []),
                ...(remDay.completedJuzIds || []),
              ])
            );
      const combinedJuzCompletedCount =
        isLocalNewer && locDay.juzCompletedCount !== undefined
          ? locDay.juzCompletedCount
          : Math.max(
              locDay.juzCompletedCount || 0,
              remDay.juzCompletedCount || 0,
              combinedCompletedJuzIds.length
            );

      mergedHistory[date] = {
        date,
        secondsRead: Math.max(locDay.secondsRead || 0, remDay.secondsRead || 0),
        targetReached: Boolean(locDay.targetReached || remDay.targetReached || combinedJuzCompletedCount > 0),
        slots: combinedSlots,
        juzCompletedCount: combinedJuzCompletedCount,
        completedJuzIds: combinedCompletedJuzIds,
      };
    }
  }

  return mergedHistory;
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

  const isLocalNewer = localTime >= remoteTime;

  // Merge history records and user logs so data from either device is preserved
  const mergedHistory = mergeHistoryRecords(
    local.historyRecords || {},
    remote.historyRecords || {},
    isLocalNewer
  );

  // Deduplicate user logs by ID
  const logMap = new Map<string, UserLogEntry>();
  (local.userLogs || []).forEach((log) => logMap.set(log.id, log));
  (remote.userLogs || []).forEach((log) => logMap.set(log.id, log));
  const mergedLogs = Array.from(logMap.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Merge completed Juzs (union of distinct IDs 1-30 unless local is newer and set)
  const mergedCompletedJuzs =
    isLocalNewer && local.completedJuzs !== undefined
      ? local.completedJuzs
      : Array.from(
          new Set([...(local.completedJuzs || []), ...(remote.completedJuzs || [])])
        ).sort((a, b) => a - b);

  const mergedTally =
    isLocalNewer && local.juzTally !== undefined
      ? local.juzTally
      : Math.max(
          local.juzTally || 0,
          remote.juzTally || 0,
          mergedCompletedJuzs.length
        );

  const localKhatm = local.khatmPlan;
  const remoteKhatm = remote.khatmPlan;
  let mergedKhatm = localKhatm;
  if (remoteKhatm) {
    if (!localKhatm) {
      mergedKhatm = remoteKhatm;
    } else {
      const localTime = new Date(localKhatm.updatedAt || 0).getTime();
      const remoteTime = new Date(remoteKhatm.updatedAt || 0).getTime();
      mergedKhatm = remoteTime >= localTime ? remoteKhatm : localKhatm;
    }
  }

  // Deduplicate sync points by ID, sort newest first, max 50
  const syncPointMap = new Map<string, SyncPoint>();
  (local.syncPoints || []).forEach((sp) => syncPointMap.set(sp.id, sp));
  (remote.syncPoints || []).forEach((sp) => syncPointMap.set(sp.id, sp));
  const mergedSyncPoints = Array.from(syncPointMap.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50);

  return {
    ...base,
    ...authIdentity,
    historyRecords: mergedHistory,
    userLogs: mergedLogs,
    completedJuzs: mergedCompletedJuzs,
    juzTally: mergedTally,
    khatmPlan: mergedKhatm,
    syncPoints: mergedSyncPoints,
  };
}

