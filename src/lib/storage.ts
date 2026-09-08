import { AppSettings, DayReadingRecord, UserLogEntry, UserState } from "../types/quran";
import { getLocalDateString } from "./utils";

const STATE_KEY = "qleading_state_v1";
const SETTINGS_KEY = "qleading_settings_v1";

export const DEFAULT_SETTINGS: AppSettings = {
  rewindStepSeconds: 15,
  forwardStepSeconds: 15,
  timerTargetMinutes: 30,
  timerMode: "countdown",
  streakStartDay: 1, // Monday
  preferLocalAudio: false,
  themeMode: "dark",
  themeColor: "sky",
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
  lastActiveDate: getLocalDateString(),
  updatedAt: new Date().toISOString(),
  historyRecords: {},
  userLogs: [],
};

export function getStoredSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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
    return { ...INITIAL_USER_STATE, ...parsed };
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

  // Determine which state has the most recent position/timer
  const base = remoteTime > localTime ? remote : local;

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
      mergedHistory[date] = {
        date,
        secondsRead: Math.max(locDay.secondsRead, remDay.secondsRead),
        targetReached: locDay.targetReached || remDay.targetReached,
        slots: combinedSlots,
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

  return {
    ...base,
    historyRecords: mergedHistory,
    userLogs: mergedLogs,
  };
}

