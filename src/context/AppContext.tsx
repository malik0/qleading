"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  AccountResetPayload,
  AccidentRecord,
  AppSettings,
  DayReadingRecord,
  JuzInfo,
  KhatmPlan,
  PlaybackSpeed,
  SyncPoint,
  ThemeColor,
  ThemeMode,
  TimerMode,
  UserLogEntry,
  UserState,
} from "../types/quran";
import { INITIAL_JUZ_LIST } from "../data/juzList";
import {
  DEFAULT_SETTINGS,
  INITIAL_USER_STATE,
  getStoredSettings,
  getStoredState,
  saveStoredSettings,
  saveStoredState,
  reconcileStates,
  reconcileSettings,
  mergeHistoryRecords,
  getDeviceId,
} from "../lib/storage";
import { getLocalDateString, getSlotIndexForDate, formatHeroTimer } from "../lib/utils";

function isSameAudioUrl(src1?: string | null, src2?: string | null): boolean {
  if (!src1 || !src2) return false;
  if (src1 === src2) return true;
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u1 = new URL(src1, origin);
    const u2 = new URL(src2, origin);
    return u1.href === u2.href;
  } catch {
    return src1 === src2;
  }
}

interface AppContextType {
  // Juz info & lists
  juzList: JuzInfo[];
  currentJuz: JuzInfo;
  currentJuzId: number;
  juzName: string;
  juzRange: string;

  // Audio Playback
  isPlaying: boolean;
  playbackPosition: number; // in seconds
  duration: number; // in seconds
  playbackSpeed: PlaybackSpeed;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  rewind: () => void;
  fastForward: () => void;
  resetTrack: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  selectJuz: (juzId: number) => void;
  confirmJuzSwitch: (juzId: number) => void;
  pendingJuzSwitch: number | null;
  cancelJuzSwitch: () => void;

  // Hero Timer
  timerSeconds: number;
  timerTargetMinutes: number;
  timerMode: TimerMode;
  isTimerRunning: boolean;
  resetTimer: () => void;
  setTimerSeconds: (seconds: number) => void;
  adjustTimerDefault: (minutes: number, resetCurrent?: boolean) => void;
  setTimerMode: (mode: TimerMode, resetCurrent?: boolean) => void;
  matchAudio: () => { timeLeft: number; speed: number; rawTimeLeft: number };
  isTimerMatchedToAudio: boolean;

  // Settings
  // Settings & Appearance
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  resolvedTheme: "dark" | "light";
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;

  // Streaks & Chart
  streakTargetMinutes: number;
  setStreakTargetMinutes: (minutes: number) => void;
  historyRecords: Record<string, DayReadingRecord>;
  todayRecord: DayReadingRecord;
  userLogs: UserLogEntry[];

  // Juz Checklist & Tally
  completedJuzs: number[];
  juzTally: number;
  toggleJuzCompleted: (juzId: number) => void;
  setJuzTallyManually: (tally: number, completedIds?: number[]) => void;
  setTodayJuzCountManually: (count: number) => void;
  setCompletedStreakDaysManually: (daysCount: number) => void;
  setTallyAndStreakProgressManually: (params: {
    tally: number;
    completedIds?: number[];
    streakDays?: number;
    todayJuzCount?: number;
    targetDate?: string;
    dateJuzCount?: number;
    dateJuzCounts?: Record<string, number>;
  }) => void;
  toggleDayStreakManually: (dateStr: string) => void;

  // Khatm Planner
  khatmPlan: KhatmPlan | null;
  saveKhatmPlan: (plan: KhatmPlan) => void;
  toggleKhatmDayCompleted: (dayIndex: number) => void;
  deleteKhatmPlan: () => void;
  resetKhatmPlanProgress: () => void;

  // User Auth & Sync
  userState: UserState;
  loginUser: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (username: string, email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  generateRandomUser: () => Promise<{
    success: boolean;
    error?: string;
    credentials?: { username: string; email: string; password?: string };
  }>;
  resetAccountDetails: (payload: AccountResetPayload) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  logoutUser: () => Promise<void>;
  isSyncing: boolean;
  lastSynced: string | null;
  manualSync: () => Promise<void>;
  syncNotice: string | null;

  // Roll Back & Synch Points
  syncPoints: SyncPoint[];
  saveSyncPoint: (label?: string) => void;
  rollbackToSyncPoint: (point: SyncPoint) => void;
  rollbackToAccidentFifteenSeconds: () => void;
  lastAccident: AccidentRecord | null;
  isLastSyncPointOlderThan1Min: boolean;
  isRollBackOpen: boolean;
  setIsRollBackOpen: (open: boolean) => void;
  openRollBack: () => void;
  closeRollBack: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [userState, setUserState] = useState<UserState>(INITIAL_USER_STATE);
  const [isClient, setIsClient] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const preloadedJuzIdRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const initialDuration =
    INITIAL_JUZ_LIST.find((j) => j.id === (INITIAL_USER_STATE.currentJuzId || 1))
      ?.approxDurationSeconds || 2776;
  const [duration, setDuration] = useState(initialDuration);
  const [playbackSpeed, setPlaybackSpeedState] = useState<PlaybackSpeed>(1.0);
  const [isTimerMatchedToAudio, setIsTimerMatchedToAudio] = useState(false);
  const [pendingJuzSwitch, setPendingJuzSwitch] = useState<number | null>(null);
  const [failedLocalJuzs, setFailedLocalJuzs] = useState<Record<number, boolean>>({});

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Roll Back & Synch Points state
  const [isRollBackOpen, setIsRollBackOpen] = useState(false);
  const [lastAccident, setLastAccident] = useState<AccidentRecord | null>(null);
  const recentHistoryRef = useRef<Array<{ time: number; juzId: number; position: number; timerSeconds: number }>>([]);

  const openRollBack = useCallback(() => setIsRollBackOpen(true), []);
  const closeRollBack = useCallback(() => setIsRollBackOpen(false), []);

  // References for interval tracking
  // References for interval tracking and stale-closure prevention
  const lastActiveDateRef = useRef(getLocalDateString());
  const timerSecondsRef = useRef(userState.timerSeconds);
  const playbackPosRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const userStateRef = useRef(userState);
  const settingsRef = useRef(settings);
  const isTimerMatchedToAudioRef = useRef(false);
  const durationRef = useRef(initialDuration);
  const playbackSpeedRef = useRef<PlaybackSpeed>(1.0);
  const currentJuzRef = useRef(INITIAL_JUZ_LIST[0]);

  // Sync refs with state
  useEffect(() => {
    userStateRef.current = userState;
    timerSecondsRef.current = userState.timerSeconds;
  }, [userState]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    playbackPosRef.current = playbackPosition;
  }, [playbackPosition]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  // Load from local storage on mount
  // Load from local storage on mount & check Cloudflare D1 session
  useEffect(() => {
    setIsClient(true);
    const loadedSettings = getStoredSettings();
    const loadedState = getStoredState();

    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    // In production on the web, local files cannot be served due to Worker asset size limits.
    // Ensure preferLocalAudio is false on remote domains.
    if (!isLocal && loadedSettings.preferLocalAudio) {
      loadedSettings.preferLocalAudio = false;
      saveStoredSettings(loadedSettings);
    }

    setSettings(loadedSettings);
    if (loadedSettings.defaultPlaybackSpeed) {
      setPlaybackSpeedState(loadedSettings.defaultPlaybackSpeed);
      if (audioRef.current) {
        audioRef.current.playbackRate = loadedSettings.defaultPlaybackSpeed;
      }
    }
    if (!loadedState.syncPoints || loadedState.syncPoints.length === 0) {
      const initJuz = INITIAL_JUZ_LIST.find((j) => j.id === (loadedState.currentJuzId || 1)) || INITIAL_JUZ_LIST[0];
      const initialPoint: SyncPoint = {
        id: "sp_init_" + Date.now(),
        timestamp: new Date().toISOString(),
        juzId: loadedState.currentJuzId || 1,
        juzName: initJuz.customName || initJuz.defaultName,
        playbackPositionSeconds: loadedState.playbackPositionSeconds || 0,
        audioDurationSeconds: initJuz.approxDurationSeconds || 3300,
        timerSeconds: loadedState.timerSeconds || 1800,
        timerTargetMinutes: loadedSettings.timerTargetMinutes || 30,
        label: "Initial Session",
      };
      loadedState.syncPoints = [initialPoint];
      saveStoredState(loadedState);
    }

    setUserState(loadedState);
    userStateRef.current = loadedState;
    settingsRef.current = loadedSettings;
    setPlaybackPosition(loadedState.playbackPositionSeconds || 0);
    playbackPosRef.current = loadedState.playbackPositionSeconds || 0;
    timerSecondsRef.current = loadedState.timerSeconds || loadedSettings.timerTargetMinutes * 60;
    lastActiveDateRef.current = loadedState.lastActiveDate || getLocalDateString();

    // Check Cloudflare D1 active session and reconcile
    fetch("/api/auth?action=me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.state) {
          const targetPos = data.state.playbackPositionSeconds || 0;
          const targetJuzId = data.state.currentJuzId || 1;

          const mergedHistory = mergeHistoryRecords(
            loadedState.historyRecords || {},
            data.state.historyRecords || {}
          );
          const mergedLogs = [
            ...(data.state.userLogs || []),
            ...(loadedState.userLogs || []),
          ].filter((log, idx, arr) => arr.findIndex((l) => l.id === log.id) === idx);

          const mergedCompletedJuzs = Array.from(
            new Set([
              ...(loadedState.completedJuzs || []),
              ...(data.state.completedJuzs || []),
            ])
          ).sort((a, b) => a - b);

          const mergedSyncPoints = Array.from(
            new Map<string, SyncPoint>([
              ...(loadedState.syncPoints || []).map((sp: SyncPoint) => [sp.id, sp] as [string, SyncPoint]),
              ...((data.state.syncPoints || []) as SyncPoint[]).map((sp: SyncPoint) => [sp.id, sp] as [string, SyncPoint]),
            ]).values()
          )
            .sort((a: SyncPoint, b: SyncPoint) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 50);

          const syncedState: UserState = {
            ...loadedState,
            ...data.state,
            currentJuzId: targetJuzId,
            playbackPositionSeconds: targetPos,
            historyRecords: mergedHistory,
            userLogs: mergedLogs,
            completedJuzs: mergedCompletedJuzs,
            syncPoints: mergedSyncPoints,
          };

          setUserState(syncedState);
          userStateRef.current = syncedState;
          saveStoredState(syncedState);

          if (targetJuzId !== loadedState.currentJuzId) {
            const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === targetJuzId) || INITIAL_JUZ_LIST[0];
            const targetUrl = getAudioUrlForJuz(targetJuz);
            if (audioRef.current && !isSameAudioUrl(audioRef.current.src, targetUrl)) {
              audioRef.current.src = targetUrl;
            }
          }

          if (audioRef.current && targetPos > 0) {
            audioRef.current.currentTime = targetPos;
          }
          setPlaybackPosition(targetPos);
          playbackPosRef.current = targetPos;

          if (data.settings) {
            const mergedSettings = reconcileSettings(loadedSettings, data.settings);
            setSettings(mergedSettings);
            settingsRef.current = mergedSettings;
            saveStoredSettings(mergedSettings);
            if (mergedSettings.defaultPlaybackSpeed) {
              setPlaybackSpeedState(mergedSettings.defaultPlaybackSpeed);
              if (audioRef.current) {
                audioRef.current.playbackRate = mergedSettings.defaultPlaybackSpeed;
              }
            }
          }

          setLastSynced(new Date().toLocaleTimeString());
        }
      })
      .catch((e) => console.warn("Session check skipped/offline:", e));
  }, []);

  // Construct active Juz list with custom overrides
  const juzList: JuzInfo[] = useMemo(
    () =>
      INITIAL_JUZ_LIST.map((j) => ({
        ...j,
        customName: settings.customJuzNames?.[j.id] || undefined,
        customRange: settings.customJuzRanges?.[j.id] || undefined,
      })),
    [settings.customJuzNames, settings.customJuzRanges]
  );

  const currentJuz =
    juzList.find((j) => j.id === userState.currentJuzId) || juzList[0];

  useEffect(() => {
    currentJuzRef.current = currentJuz;
  }, [currentJuz]);

  const juzName = currentJuz.customName || currentJuz.defaultName;
  const juzRange = currentJuz.customRange || currentJuz.defaultRange;


  // Determine active audio URL:
  // Uses local WebM files if preferLocalAudio is enabled and file has not failed,
  // otherwise uses CDN MP3 streaming URL.
  const getAudioUrlForJuz = useCallback(
    (juz: JuzInfo) => {
      if (settings.preferLocalAudio && !failedLocalJuzs[juz.id]) {
        return juz.localAudioUrl;
      }
      return juz.cdnAudioUrl;
    },
    [settings.preferLocalAudio, failedLocalJuzs]
  );

  const activeAudioUrl = getAudioUrlForJuz(currentJuz);

  // Synchronize audio element src with activeAudioUrl
  // Uses isSameAudioUrl to avoid rewriting DOM .src when URLs match, preventing
  // the browser from aborting ongoing playback or resetting the media pipeline.
  useEffect(() => {
    if (!audioRef.current || !activeAudioUrl) return;
    if (isTransitioningRef.current) return;
    if (!isSameAudioUrl(audioRef.current.src, activeAudioUrl)) {
      const wasPlaying = isPlayingRef.current;
      audioRef.current.src = activeAudioUrl;
      const spd = playbackSpeedRef.current || playbackSpeed || 1.0;
      audioRef.current.playbackRate = spd;
      audioRef.current.defaultPlaybackRate = spd;
      if (wasPlaying) {
        audioRef.current.play().catch((err) => {
          if (err.name === "AbortError") return;
          console.warn("Audio sync playback failed:", err);
          setIsPlaying(false);
          isPlayingRef.current = false;
        });
      }
    }
  }, [activeAudioUrl, playbackSpeed]);

  // Preload upcoming Juz audio in the background to ensure zero-latency gapless transitions
  const triggerPreloadNext = useCallback(() => {
    const curId = userStateRef.current.currentJuzId || 1;
    const nextId = curId < 30 ? curId + 1 : 1;
    if (preloadedJuzIdRef.current === nextId) return;

    const nextJuz = INITIAL_JUZ_LIST.find((j) => j.id === nextId) || INITIAL_JUZ_LIST[0];
    const nextUrl = getAudioUrlForJuz(nextJuz);

    preloadedJuzIdRef.current = nextId;
    if (preloadAudioRef.current) {
      preloadAudioRef.current.src = nextUrl;
      preloadAudioRef.current.preload = "auto";
      preloadAudioRef.current.load();
    }
  }, [getAudioUrlForJuz]);

  // Update Settings
  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    let nextSettings: AppSettings = settingsRef.current;
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      nextSettings = next;
      settingsRef.current = next;
      saveStoredSettings(next);
      return next;
    });
    if (partial.defaultPlaybackSpeed !== undefined) {
      setPlaybackSpeedState(partial.defaultPlaybackSpeed);
      if (audioRef.current) {
        audioRef.current.playbackRate = partial.defaultPlaybackSpeed;
      }
    }

    // Persist settings into database if user is logged in
    if (userStateRef.current.isLoggedIn) {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: userStateRef.current,
          settings: { ...settingsRef.current, ...partial },
          deviceId: getDeviceId(),
          isPlaying: isPlayingRef.current,
          action: "updateSettings",
        }),
      }).catch((err) => console.warn("Settings sync offline/failed:", err));
    }
  }, []);

  // Theme Engine & DOM Sync
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const computeResolvedTheme = (): "dark" | "light" => {
      if (settings.themeMode === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      return settings.themeMode === "light" ? "light" : "dark";
    };

    const resolved = computeResolvedTheme();
    setResolvedTheme(resolved);

    const root = document.documentElement;
    if (resolved === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }

    root.setAttribute("data-theme-color", settings.themeColor || "sky");

    // Dynamic browser address bar & PWA status bar theming
    try {
      const metaTheme = document.querySelector("meta[name='theme-color']");
      if (metaTheme) {
        const computedStyle = getComputedStyle(root);
        const bgBase = computedStyle.getPropertyValue("--bg-base").trim();
        if (bgBase) {
          metaTheme.setAttribute("content", bgBase);
        }
      }
    } catch {}

    if (settings.themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        const next = e.matches ? "dark" : "light";
        setResolvedTheme(next);
        if (next === "dark") {
          root.classList.add("dark");
          root.classList.remove("light");
        } else {
          root.classList.remove("dark");
          root.classList.add("light");
        }
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [settings.themeMode, settings.themeColor]);

  const toggleThemeMode = useCallback(() => {
    const nextMode: ThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    updateSettings({ themeMode: nextMode });
  }, [resolvedTheme, updateSettings]);

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      updateSettings({ themeMode: mode });
    },
    [updateSettings]
  );

  const setThemeColor = useCallback(
    (color: ThemeColor) => {
      updateSettings({ themeColor: color });
    },
    [updateSettings]
  );

  // Update User State and save immediately
  const updateStateAndPersist = useCallback(
    (updater: (prev: UserState) => UserState) => {
      setUserState((prev) => {
        const next = updater(prev);
        const timestamped = {
          ...next,
          updatedAt: new Date().toISOString(),
        };
        userStateRef.current = timestamped;
        saveStoredState(timestamped);
        return timestamped;
      });
    },
    []
  );

  // Broadcast playback changes to other tabs in the same browser session
  const broadcastPlayback = useCallback((type: "PLAY" | "PAUSE", payload?: any) => {
    try {
      broadcastChannelRef.current?.postMessage({
        type,
        deviceId: getDeviceId(),
        juzId: userStateRef.current.currentJuzId,
        position: playbackPosRef.current,
        ...payload,
      });
    } catch {}
  }, []);

  // Record accidental user actions and compute state 15 seconds before the accident
  const recordAccident = useCallback(
    (
      type: "reset_track" | "switch_juz" | "seek_jump" | "timer_reset" | "manual",
      desc: string
    ) => {
      const now = Date.now();
      const currentJuzId = userStateRef.current.currentJuzId;
      const curJuz = INITIAL_JUZ_LIST.find((j) => j.id === currentJuzId) || INITIAL_JUZ_LIST[0];
      const curName = curJuz.customName || curJuz.defaultName;
      const curPos = playbackPosRef.current;
      const curTimer = timerSecondsRef.current;

      // Find entry in recent history from 15 seconds ago (now - 15000)
      const targetTime = now - 15000;
      let fifteenState = {
        juzId: currentJuzId,
        juzName: curName,
        playbackPositionSeconds: Math.max(0, curPos - 15),
        timerSeconds: curTimer + 15,
      };

      const history = recentHistoryRef.current;
      if (history.length > 0) {
        let closest = history[0];
        let minDiff = Math.abs(history[0].time - targetTime);
        for (let i = 1; i < history.length; i++) {
          const diff = Math.abs(history[i].time - targetTime);
          if (diff < minDiff) {
            minDiff = diff;
            closest = history[i];
          }
        }
        if (minDiff < 10000) {
          const matchJuz = INITIAL_JUZ_LIST.find((j) => j.id === closest.juzId) || INITIAL_JUZ_LIST[0];
          fifteenState = {
            juzId: closest.juzId,
            juzName: matchJuz.customName || matchJuz.defaultName,
            playbackPositionSeconds: closest.position,
            timerSeconds: closest.timerSeconds,
          };
        }
      }

      const record: AccidentRecord = {
        timestamp: now,
        actionType: type,
        description: desc,
        beforeState: {
          juzId: currentJuzId,
          juzName: curName,
          playbackPositionSeconds: curPos,
          timerSeconds: curTimer,
        },
        fifteenSecBeforeState: fifteenState,
      };
      setLastAccident(record);
    },
    []
  );

  // Save a new synch point checkpoint
  const saveSyncPoint = useCallback(
    (label: string = "Checkpoint") => {
      const nowIso = new Date().toISOString();
      const curJuzId = userStateRef.current.currentJuzId;
      const curJuz = INITIAL_JUZ_LIST.find((j) => j.id === curJuzId) || INITIAL_JUZ_LIST[0];
      const name = curJuz.customName || curJuz.defaultName;
      const pos = playbackPosRef.current;
      const timer = timerSecondsRef.current;
      const dur = audioRef.current?.duration || curJuz.approxDurationSeconds || 3300;

      const newPoint: SyncPoint = {
        id: "sp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        timestamp: nowIso,
        juzId: curJuzId,
        juzName: name,
        playbackPositionSeconds: Math.floor(pos),
        audioDurationSeconds: Math.floor(dur),
        timerSeconds: timer,
        timerTargetMinutes: settingsRef.current.timerTargetMinutes,
        label,
      };

      updateStateAndPersist((prev) => {
        const existing = prev.syncPoints || [];
        // Prevent duplicate spam if saved in the same second at same position
        if (existing.length > 0 && !label.includes("Stopped") && !label.includes("Paused")) {
          const last = existing[0];
          if (
            last.juzId === curJuzId &&
            Math.abs(last.playbackPositionSeconds - pos) < 2 &&
            Math.abs(new Date(last.timestamp).getTime() - Date.now()) < 3000
          ) {
            return prev;
          }
        }
        return {
          ...prev,
          syncPoints: [newPoint, ...existing].slice(0, 50),
        };
      });
    },
    [updateStateAndPersist]
  );

  // Revert back to a chosen synch point
  const rollbackToSyncPoint = useCallback(
    (point: SyncPoint) => {
      const targetJuzId = point.juzId;
      const targetPos = point.playbackPositionSeconds;
      const targetTimer = point.timerSeconds;
      const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === targetJuzId) || INITIAL_JUZ_LIST[0];
      const targetUrl = getAudioUrlForJuz(targetJuz);

      if (targetJuzId !== userStateRef.current.currentJuzId) {
        if (audioRef.current && !isSameAudioUrl(audioRef.current.src, targetUrl)) {
          audioRef.current.src = targetUrl;
        }
      }

      if (audioRef.current) {
        audioRef.current.currentTime = targetPos;
      }
      setPlaybackPosition(targetPos);
      playbackPosRef.current = targetPos;
      timerSecondsRef.current = targetTimer;

      updateStateAndPersist((s) => ({
        ...s,
        currentJuzId: targetJuzId,
        playbackPositionSeconds: targetPos,
        timerSeconds: targetTimer,
      }));

      broadcastPlayback("PAUSE", { juzId: targetJuzId, position: targetPos });

      const mins = Math.floor(targetPos / 60);
      const secs = Math.floor(targetPos % 60);
      const posStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      setSyncNotice(`Rolled back to ${point.juzName} (${posStr}) • Big Timer ${formatHeroTimer(targetTimer)}`);
      setTimeout(() => setSyncNotice(null), 5000);
    },
    [getAudioUrlForJuz, updateStateAndPersist, broadcastPlayback]
  );

  // Revert back to 15 seconds before the accident
  const rollbackToAccidentFifteenSeconds = useCallback(() => {
    let targetState = lastAccident?.fifteenSecBeforeState;
    if (!targetState) {
      const curJuzId = userStateRef.current.currentJuzId;
      const curJuz = INITIAL_JUZ_LIST.find((j) => j.id === curJuzId) || INITIAL_JUZ_LIST[0];
      targetState = {
        juzId: curJuzId,
        juzName: curJuz.customName || curJuz.defaultName,
        playbackPositionSeconds: Math.max(0, playbackPosRef.current - 15),
        timerSeconds: timerSecondsRef.current + 15,
      };
    }

    const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === targetState.juzId) || INITIAL_JUZ_LIST[0];
    const targetUrl = getAudioUrlForJuz(targetJuz);

    if (targetState.juzId !== userStateRef.current.currentJuzId) {
      if (audioRef.current && !isSameAudioUrl(audioRef.current.src, targetUrl)) {
        audioRef.current.src = targetUrl;
      }
    }

    if (audioRef.current) {
      audioRef.current.currentTime = targetState.playbackPositionSeconds;
    }
    setPlaybackPosition(targetState.playbackPositionSeconds);
    playbackPosRef.current = targetState.playbackPositionSeconds;
    timerSecondsRef.current = targetState.timerSeconds;

    updateStateAndPersist((s) => ({
      ...s,
      currentJuzId: targetState.juzId,
      playbackPositionSeconds: targetState.playbackPositionSeconds,
      timerSeconds: targetState.timerSeconds,
    }));

    broadcastPlayback("PAUSE", {
      juzId: targetState.juzId,
      position: targetState.playbackPositionSeconds,
    });

    saveSyncPoint("Rolled Back (-15s Before Accident)");

    const mins = Math.floor(targetState.playbackPositionSeconds / 60);
    const secs = Math.floor(targetState.playbackPositionSeconds % 60);
    const posStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    setSyncNotice(
      `Rolled back 15s before accident • ${targetState.juzName} (${posStr}) • Big Timer ${formatHeroTimer(
        targetState.timerSeconds
      )}`
    );
    setTimeout(() => setSyncNotice(null), 5000);
  }, [
    lastAccident,
    getAudioUrlForJuz,
    updateStateAndPersist,
    broadcastPlayback,
    saveSyncPoint,
  ]);

  // Determine if the last synch point is more than 1 minute earlier
  const syncPoints = userState.syncPoints || [];
  const lastSyncPoint = syncPoints[0];
  const referenceTime = lastAccident ? lastAccident.timestamp : Date.now();
  const isLastSyncPointOlderThan1Min =
    !lastSyncPoint || referenceTime - new Date(lastSyncPoint.timestamp).getTime() > 60 * 1000;

  // Multi-tab BroadcastChannel listener
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("qleading_sync_channel");
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || data.deviceId === getDeviceId()) return;

      if (data.type === "PLAY") {
        // Another tab began playing
        if (isPlayingRef.current) {
          audioRef.current?.pause();
          setIsPlaying(false);
          isPlayingRef.current = false;
          setSyncNotice("Playback active in another tab");
          setTimeout(() => setSyncNotice(null), 5000);
        }
        if (data.juzId && data.juzId !== userStateRef.current.currentJuzId) {
          setUserState((prev) => ({
            ...prev,
            currentJuzId: data.juzId,
            playbackPositionSeconds: data.position || 0,
          }));
          if (audioRef.current) {
            const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === data.juzId) || INITIAL_JUZ_LIST[0];
            audioRef.current.src = targetJuz.localAudioUrl;
            const targetUrl = getAudioUrlForJuz(targetJuz);
            if (!isSameAudioUrl(audioRef.current.src, targetUrl)) {
              audioRef.current.src = targetUrl;
            }
            audioRef.current.currentTime = data.position || 0;
          }
        }
        setLastSynced(new Date().toLocaleTimeString());
        if (data.position !== undefined) {
          setPlaybackPosition(data.position);
          playbackPosRef.current = data.position;
        }
      } else if (data.type === "PAUSE") {
        if (data.position !== undefined) {
          setPlaybackPosition(data.position);
          playbackPosRef.current = data.position;
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [getAudioUrlForJuz]);

  // Unified Sync with Cloudflare D1
  const syncWithServer = useCallback(
    async (
      customState?: UserState,
      options?: { isStartingPlayback?: boolean; isPlaying?: boolean; action?: string }
    ) => {
      const currentState = customState || userStateRef.current;
      if (!currentState.isLoggedIn) return;

      setIsSyncing(true);
      try {
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: currentState,
            settings: settingsRef.current,
            deviceId: getDeviceId(),
            isPlaying: options?.isPlaying !== undefined ? options.isPlaying : isPlayingRef.current,
            isStartingPlayback: options?.isStartingPlayback,
            action: options?.action,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.remoteState) {
            const reconciled = reconcileStates(currentState, data.remoteState);
            setUserState(reconciled);
            userStateRef.current = reconciled;
            saveStoredState(reconciled);

            const targetPos = reconciled.playbackPositionSeconds || 0;
            const targetJuzId = reconciled.currentJuzId || 1;

            if (!isTransitioningRef.current && targetJuzId !== currentState.currentJuzId) {
              const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === targetJuzId) || INITIAL_JUZ_LIST[0];
              const targetUrl = getAudioUrlForJuz(targetJuz);
              if (audioRef.current && !isSameAudioUrl(audioRef.current.src, targetUrl)) {
                audioRef.current.src = targetUrl;
              }
            }

            if (audioRef.current && options?.isStartingPlayback) {
              audioRef.current.currentTime = targetPos;
            } else if (
              audioRef.current &&
              !isPlayingRef.current &&
              Math.abs(audioRef.current.currentTime - targetPos) > 3
            ) {
              audioRef.current.currentTime = targetPos;
            }
            setPlaybackPosition(targetPos);
            playbackPosRef.current = targetPos;
          }

          if (data.settings) {
            const reconciledSettings = reconcileSettings(settingsRef.current, data.settings);
            setSettings(reconciledSettings);
            settingsRef.current = reconciledSettings;
            saveStoredSettings(reconciledSettings);
            if (reconciledSettings.defaultPlaybackSpeed && audioRef.current) {
              audioRef.current.playbackRate = reconciledSettings.defaultPlaybackSpeed;
            }
          }

          setLastSynced(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.warn("Background sync offline/failed:", err);
      } finally {
        setIsSyncing(false);
      }
    },
    [getAudioUrlForJuz]
  );

  const manualSync = useCallback(async () => {
    if (!userStateRef.current.isLoggedIn) {
      setSyncNotice("Please log in to sync across devices");
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }
    setIsSyncing(true);
    try {
      const currentState = userStateRef.current;
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: currentState,
          settings: settingsRef.current,
          deviceId: getDeviceId(),
          isPlaying: isPlayingRef.current,
          action: "sync",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.remoteState) {
          const targetPos = data.remoteState.playbackPositionSeconds || 0;
          const targetJuzId = data.remoteState.currentJuzId || 1;

          const mergedHistory = mergeHistoryRecords(
            currentState.historyRecords || {},
            data.remoteState.historyRecords || {}
          );
          const mergedLogs = [
            ...(data.remoteState.userLogs || []),
            ...(currentState.userLogs || []),
          ].filter((log, idx, arr) => arr.findIndex((l) => l.id === log.id) === idx);

          const mergedCompletedJuzs = Array.from(
            new Set([
              ...(currentState.completedJuzs || []),
              ...(data.remoteState.completedJuzs || []),
            ])
          ).sort((a, b) => a - b);

          const syncedState: UserState = {
            ...currentState,
            ...data.remoteState,
            currentJuzId: targetJuzId,
            playbackPositionSeconds: targetPos,
            historyRecords: mergedHistory,
            userLogs: mergedLogs,
            completedJuzs: mergedCompletedJuzs,
          };

          setUserState(syncedState);
          userStateRef.current = syncedState;
          saveStoredState(syncedState);

          if (targetJuzId !== currentState.currentJuzId) {
            const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === targetJuzId) || INITIAL_JUZ_LIST[0];
            const targetUrl = getAudioUrlForJuz(targetJuz);
            if (audioRef.current && !isSameAudioUrl(audioRef.current.src, targetUrl)) {
              audioRef.current.src = targetUrl;
            }
          }

          if (audioRef.current) {
            audioRef.current.currentTime = targetPos;
          }
          setPlaybackPosition(targetPos);
          playbackPosRef.current = targetPos;

          const syncedTimerSec = data.remoteState.timerSeconds ?? (settingsRef.current.timerTargetMinutes * 60);
          timerSecondsRef.current = syncedTimerSec;
        }

        if (data.settings) {
          const reconciledSettings = reconcileSettings(settingsRef.current, data.settings);
          setSettings(reconciledSettings);
          settingsRef.current = reconciledSettings;
          saveStoredSettings(reconciledSettings);
          if (reconciledSettings.defaultPlaybackSpeed && audioRef.current) {
            audioRef.current.playbackRate = reconciledSettings.defaultPlaybackSpeed;
          }
        }

        const syncTime = new Date().toLocaleTimeString();
        setLastSynced(syncTime);
        const mins = Math.floor((data.remoteState?.playbackPositionSeconds || 0) / 60);
        const secs = Math.floor((data.remoteState?.playbackPositionSeconds || 0) % 60);
        const posStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        setSyncNotice(`Synced with cloud • Juz ${data.remoteState?.currentJuzId || 1} at ${posStr}`);
        setTimeout(() => setSyncNotice(null), 5000);
        saveSyncPoint("Manual Sync");
      } else {
        setSyncNotice("Sync failed. Check connection.");
        setTimeout(() => setSyncNotice(null), 4000);
      }
    } catch (err) {
      console.warn("Manual sync offline/failed:", err);
      setSyncNotice("Sync offline. Using local cache.");
      setTimeout(() => setSyncNotice(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  }, [getAudioUrlForJuz, saveSyncPoint]);

  // Periodic Heartbeat & Auto-Sync during active playback (every 10 seconds)
  useEffect(() => {
    if (!isPlaying || !userState.isLoggedIn) return;

    const interval = setInterval(() => {
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: userStateRef.current,
          settings: settingsRef.current,
          deviceId: getDeviceId(),
          isPlaying: true,
          action: "heartbeat",
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.remoteState) {
            // Check if server recorded active device switch to another device
            const myDevId = getDeviceId();
            if (
              data.remoteState.activeDeviceId &&
              data.remoteState.activeDeviceId !== myDevId &&
              data.remoteState.isPlaying
            ) {
              audioRef.current?.pause();
              setIsPlaying(false);
              isPlayingRef.current = false;
              setSyncNotice("Playback active on another device");
              setTimeout(() => setSyncNotice(null), 6000);
            }
          }
          setLastSynced(new Date().toLocaleTimeString());
        })
        .catch(() => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [isPlaying, userState.isLoggedIn]);

  // Constant Check (4s Polling & Visibility Changes) to prevent device collision
  useEffect(() => {
    if (!userState.isLoggedIn) return;

    const runConstantCheck = async () => {
      if (isSyncing) return;

      try {
        const res = await fetch(`/api/sync?userId=${encodeURIComponent(userState.userId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.state) return;

        const remoteState: UserState = data.state;
        const myDeviceId = getDeviceId();
        const isRemotePlaying = Boolean(remoteState.isPlaying);
        const remoteDeviceId = remoteState.activeDeviceId;

        // Condition A: Another device is actively playing
        if (isRemotePlaying && remoteDeviceId && remoteDeviceId !== myDeviceId) {
          if (isPlayingRef.current) {
            audioRef.current?.pause();
            setIsPlaying(false);
            isPlayingRef.current = false;
            setSyncNotice("Playback active on another device");
            setTimeout(() => setSyncNotice(null), 6000);
          }

          const reconciled = reconcileStates(userStateRef.current, remoteState);
          setUserState(reconciled);
          userStateRef.current = reconciled;
          saveStoredState(reconciled);

          if (reconciled.currentJuzId !== userStateRef.current.currentJuzId) {
            const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === reconciled.currentJuzId) || INITIAL_JUZ_LIST[0];
            const targetUrl = getAudioUrlForJuz(targetJuz);
            if (audioRef.current && !isSameAudioUrl(audioRef.current.src, targetUrl)) {
              audioRef.current.src = targetUrl;
            }
          }
          if (
            audioRef.current &&
            !isPlayingRef.current &&
            Math.abs(audioRef.current.currentTime - (reconciled.playbackPositionSeconds || 0)) > 3
          ) {
            audioRef.current.currentTime = reconciled.playbackPositionSeconds || 0;
          }
          setPlaybackPosition(reconciled.playbackPositionSeconds || 0);
          playbackPosRef.current = reconciled.playbackPositionSeconds || 0;
          setLastSynced(new Date().toLocaleTimeString());
        }
        // Condition B: Local device is paused, pull newer progress from server
        else if (!isPlayingRef.current) {
          const remoteTime = new Date(remoteState.updatedAt || 0).getTime();
          const localTime = new Date(userStateRef.current.updatedAt || 0).getTime();

          if (remoteTime > localTime) {
            const reconciled = reconcileStates(userStateRef.current, remoteState);
            setUserState(reconciled);
            userStateRef.current = reconciled;
            saveStoredState(reconciled);

            if (reconciled.currentJuzId !== userStateRef.current.currentJuzId) {
              const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === reconciled.currentJuzId) || INITIAL_JUZ_LIST[0];
              const targetUrl = getAudioUrlForJuz(targetJuz);
              if (audioRef.current && !isSameAudioUrl(audioRef.current.src, targetUrl)) {
                audioRef.current.src = targetUrl;
              }
            }
            if (
              audioRef.current &&
              Math.abs(audioRef.current.currentTime - (reconciled.playbackPositionSeconds || 0)) > 3
            ) {
              audioRef.current.currentTime = reconciled.playbackPositionSeconds || 0;
            }
            setPlaybackPosition(reconciled.playbackPositionSeconds || 0);
            playbackPosRef.current = reconciled.playbackPositionSeconds || 0;
            setLastSynced(new Date().toLocaleTimeString());
          }
        }

        if (data?.settings) {
          const reconciledSettings = reconcileSettings(settingsRef.current, data.settings);
          if (JSON.stringify(reconciledSettings) !== JSON.stringify(settingsRef.current)) {
            setSettings(reconciledSettings);
            settingsRef.current = reconciledSettings;
            saveStoredSettings(reconciledSettings);
            if (reconciledSettings.defaultPlaybackSpeed && audioRef.current) {
              audioRef.current.playbackRate = reconciledSettings.defaultPlaybackSpeed;
            }
          }
        }
      } catch {}
    };

    const interval = setInterval(runConstantCheck, 4000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        runConstantCheck();
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userState.isLoggedIn, userState.userId, isSyncing, getAudioUrlForJuz]);

  // Tab switch / page hide auto-sync
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && userStateRef.current.isLoggedIn) {
        syncWithServer();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => window.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [syncWithServer]);

  // Audio Playback Controls with Pre-Play Sync
  const play = useCallback(async () => {
    if (!audioRef.current) return;

    // Requirement: When play button is pressed a sync must be done first!
    if (userStateRef.current.isLoggedIn) {
      setIsSyncing(true);
      try {
        const currentState = userStateRef.current;
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: currentState,
            settings: settingsRef.current,
            deviceId: getDeviceId(),
            isPlaying: true,
            isStartingPlayback: true,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.remoteState) {
            const targetPos = data.remoteState.playbackPositionSeconds || 0;
            const targetJuzId = data.remoteState.currentJuzId || 1;

            const mergedHistory = mergeHistoryRecords(
              currentState.historyRecords || {},
              data.remoteState.historyRecords || {}
            );
            const mergedLogs = [
              ...(data.remoteState.userLogs || []),
              ...(currentState.userLogs || []),
            ].filter((log, idx, arr) => arr.findIndex((l) => l.id === log.id) === idx);

            const mergedCompletedJuzs = Array.from(
              new Set([
                ...(currentState.completedJuzs || []),
                ...(data.remoteState.completedJuzs || []),
              ])
            ).sort((a, b) => a - b);

            const syncedState: UserState = {
              ...currentState,
              ...data.remoteState,
              currentJuzId: targetJuzId,
              playbackPositionSeconds: targetPos,
              historyRecords: mergedHistory,
              userLogs: mergedLogs,
              completedJuzs: mergedCompletedJuzs,
            };

            setUserState(syncedState);
            userStateRef.current = syncedState;
            saveStoredState(syncedState);

            if (targetJuzId !== currentState.currentJuzId) {
              const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === targetJuzId) || INITIAL_JUZ_LIST[0];
              const targetUrl = getAudioUrlForJuz(targetJuz);
              if (audioRef.current && !isSameAudioUrl(audioRef.current.src, targetUrl)) {
                audioRef.current.src = targetUrl;
              }
            }

            if (audioRef.current) {
              audioRef.current.currentTime = targetPos;
            }
            setPlaybackPosition(targetPos);
            playbackPosRef.current = targetPos;

            const syncedTimerSec = data.remoteState.timerSeconds ?? (settingsRef.current.timerTargetMinutes * 60);
            timerSecondsRef.current = syncedTimerSec;
            setLastSynced(new Date().toLocaleTimeString());
          }

          if (data.settings) {
            const reconciledSettings = reconcileSettings(settingsRef.current, data.settings);
            setSettings(reconciledSettings);
            settingsRef.current = reconciledSettings;
            saveStoredSettings(reconciledSettings);
            if (reconciledSettings.defaultPlaybackSpeed && audioRef.current) {
              audioRef.current.playbackRate = reconciledSettings.defaultPlaybackSpeed;
            }
          }
        }
      } catch (err) {
        console.warn("Pre-play sync offline/failed, continuing locally:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    try {
      if (playbackSpeedRef.current && audioRef.current) {
        audioRef.current.playbackRate = playbackSpeedRef.current;
        audioRef.current.defaultPlaybackRate = playbackSpeedRef.current;
      }
      await audioRef.current.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
      setSyncNotice(null);
      broadcastPlayback("PLAY");
      saveSyncPoint("Playback Start");
    } catch (e) {
      console.warn("Playback error:", e);
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  }, [broadcastPlayback, getAudioUrlForJuz, saveSyncPoint]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      const currentPos = audioRef.current.currentTime;
      audioRef.current.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
      setPlaybackPosition(currentPos);
      playbackPosRef.current = currentPos;

      // Update state and persist immediately so local storage and ref have exact current position
      const updatedState: UserState = {
        ...userStateRef.current,
        playbackPositionSeconds: currentPos,
        isPlaying: false,
        updatedAt: new Date().toISOString(),
      };
      userStateRef.current = updatedState;
      setUserState(updatedState);
      saveStoredState(updatedState);

      broadcastPlayback("PAUSE", { position: currentPos });
      saveSyncPoint("Paused");
      saveSyncPoint("Audio Stopped");

      // Immediately sync pause state with the exact position to server
      if (updatedState.isLoggedIn) {
        syncWithServer(updatedState, { isPlaying: false, action: "pause" });
      }
    }
  }, [broadcastPlayback, syncWithServer, saveSyncPoint]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seekTo = useCallback(
    (seconds: number) => {
      const targetSec = Math.max(0, Math.min(seconds, duration || 99999));
      if (Math.abs(targetSec - playbackPosRef.current) > 15) {
        recordAccident("seek_jump", "Audio Scrubber Jump");
      }
      if (audioRef.current) {
        audioRef.current.currentTime = targetSec;
      }
      setPlaybackPosition(targetSec);
      playbackPosRef.current = targetSec;

      let updatedTimerSec: number | undefined = undefined;
      if (isTimerMatchedToAudioRef.current) {
        const curDur =
          audioRef.current &&
          !isNaN(audioRef.current.duration) &&
          isFinite(audioRef.current.duration) &&
          audioRef.current.duration > 0
            ? audioRef.current.duration
            : durationRef.current > 0
            ? durationRef.current
            : currentJuzRef.current.approxDurationSeconds || 2776;
        const spd = playbackSpeedRef.current || 1.0;
        const adjustedLeft = Math.max(0, Math.round((curDur - targetSec) / spd));
        timerSecondsRef.current = adjustedLeft;
        updatedTimerSec = adjustedLeft;
      }

      updateStateAndPersist((s) => ({
        ...s,
        playbackPositionSeconds: targetSec,
        ...(updatedTimerSec !== undefined ? { timerSeconds: updatedTimerSec } : {}),
      }));
    },
    [duration, updateStateAndPersist, recordAccident]
  );

  const rewind = useCallback(() => {
    seekTo(playbackPosition - settings.rewindStepSeconds);
  }, [playbackPosition, settings.rewindStepSeconds, seekTo]);

  const fastForward = useCallback(() => {
    seekTo(playbackPosition + settings.forwardStepSeconds);
  }, [playbackPosition, settings.forwardStepSeconds, seekTo]);

  const resetTrack = useCallback(() => {
    recordAccident("reset_track", "Reset Track to 00:00");
    seekTo(0);
  }, [seekTo, recordAccident]);

  const setSpeed = useCallback(
    (speed: PlaybackSpeed) => {
      setPlaybackSpeedState(speed);
      playbackSpeedRef.current = speed;
      if (audioRef.current) {
        audioRef.current.playbackRate = speed;
        audioRef.current.defaultPlaybackRate = speed;
      }
      updateSettings({ defaultPlaybackSpeed: speed });

      // Dynamically readjust Big Timer if it was matched to audio
      // Dynamically readjust Big Timer only if it was matched to audio
      if (isTimerMatchedToAudioRef.current) {
        const curDur =
          audioRef.current &&
          !isNaN(audioRef.current.duration) &&
          isFinite(audioRef.current.duration) &&
          audioRef.current.duration > 0
            ? audioRef.current.duration
            : durationRef.current > 0
            ? durationRef.current
            : currentJuzRef.current.approxDurationSeconds || 2776;
        const curPos =
          audioRef.current &&
          !isNaN(audioRef.current.currentTime) &&
          isFinite(audioRef.current.currentTime)
            ? audioRef.current.currentTime
            : playbackPosRef.current || 0;
        const rawTimeLeft = Math.max(0, Math.round(curDur - curPos));
        const adjustedTimeLeft = Math.round(rawTimeLeft / speed);
        timerSecondsRef.current = adjustedTimeLeft;
        updateStateAndPersist((prev) => ({
          ...prev,
          timerSeconds: adjustedTimeLeft,
        }));
      }
    },
    [updateSettings, updateStateAndPersist]
  );

  const confirmJuzSwitch = useCallback(
    (juzId: number) => {
      recordAccident("switch_juz", `Switched to Juz ${juzId}`);
      setPendingJuzSwitch(null);
      isTransitioningRef.current = true;
      setPlaybackPosition(0);
      playbackPosRef.current = 0;
      preloadedJuzIdRef.current = null;

      const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === juzId) || INITIAL_JUZ_LIST[0];
      const targetUrl = getAudioUrlForJuz(targetJuz);
      const targetDuration = targetJuz.approxDurationSeconds || 2776;
      setDuration(targetDuration);
      durationRef.current = targetDuration;

      const activePlaybackSpeed = playbackSpeedRef.current || playbackSpeed || 1.0;
      let nextTimerSec = timerSecondsRef.current;
      if (isTimerMatchedToAudioRef.current) {
        nextTimerSec = Math.round(targetDuration / activePlaybackSpeed);
        timerSecondsRef.current = nextTimerSec;
      }

      const updatedState: UserState = {
        ...userStateRef.current,
        currentJuzId: juzId,
        playbackPositionSeconds: 0,
        timerSeconds: nextTimerSec,
        isPlaying: true,
        updatedAt: new Date().toISOString(),
      };
      userStateRef.current = updatedState;
      setUserState(updatedState);
      saveStoredState(updatedState);

      // Directly update the track on the audio element
      if (audioRef.current) {
        if (preloadAudioRef.current) {
          preloadAudioRef.current.removeAttribute("src");
          preloadAudioRef.current.load();
        }
        audioRef.current.pause();
        audioRef.current.src = targetUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = activePlaybackSpeed;
        audioRef.current.defaultPlaybackRate = activePlaybackSpeed;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              isPlayingRef.current = true;
              isTransitioningRef.current = false;
              broadcastPlayback("PLAY", { juzId, position: 0 });
            })
            .catch((err) => {
              if (err.name === "AbortError") {
                // Benign abort caused by rapid track switch or newer media load
                return;
              }
              console.warn("Track switch play error:", err);
              setIsPlaying(false);
              isPlayingRef.current = false;
              isTransitioningRef.current = false;
            });
        } else {
          setIsPlaying(true);
          isPlayingRef.current = true;
          isTransitioningRef.current = false;
        }
      }
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 2000);
      syncWithServer(updatedState, { isPlaying: true, isStartingPlayback: true, action: "switch_juz" });
    },
    [recordAccident, getAudioUrlForJuz, playbackSpeed, broadcastPlayback, syncWithServer]
  );

  // Dropdown Juz Selection: Directly switch to the selected Juz
  const selectJuz = useCallback(
    (juzId: number) => {
      if (juzId === userState.currentJuzId) return;
      confirmJuzSwitch(juzId);
    },
    [confirmJuzSwitch, userState.currentJuzId]
  );

  const cancelJuzSwitch = useCallback(() => {
    setPendingJuzSwitch(null);
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerMatchedToAudio(false);
    isTimerMatchedToAudioRef.current = false;
    recordAccident("timer_reset", "Reset Big Timer");
    const targetSec = settings.timerTargetMinutes * 60;
    timerSecondsRef.current = targetSec;
    updateStateAndPersist((prev) => ({
      ...prev,
      timerSeconds: targetSec,
    }));
  }, [settings.timerTargetMinutes, updateStateAndPersist, recordAccident]);

  const setTimerSeconds = useCallback(
    (seconds: number) => {
      setIsTimerMatchedToAudio(false);
      isTimerMatchedToAudioRef.current = false;
      const validSec = Math.max(-86400, Math.min(86400, Math.round(seconds)));
      recordAccident("timer_reset", `Manually set Big Timer to ${formatHeroTimer(validSec)}`);
      timerSecondsRef.current = validSec;
      updateStateAndPersist((prev) => ({
        ...prev,
        timerSeconds: validSec,
      }));
    },
    [recordAccident, updateStateAndPersist]
  );

  const adjustTimerDefault = useCallback(
    (targetMinutes: number, resetCurrent: boolean = true) => {
      const validMinutes = Math.max(1, Math.min(720, Math.round(targetMinutes)));
      updateSettings({ timerTargetMinutes: validMinutes });
      if (resetCurrent) {
        setIsTimerMatchedToAudio(false);
        isTimerMatchedToAudioRef.current = false;
        const targetSec = validMinutes * 60;
        timerSecondsRef.current = targetSec;
        updateStateAndPersist((prev) => ({
          ...prev,
          timerSeconds: targetSec,
        }));
      }
    },
    [updateSettings, updateStateAndPersist]
  );

  const setTimerMode = useCallback(
    (_mode: TimerMode, resetCurrent: boolean = false) => {
      updateSettings({ timerMode: "countdown" });
      if (resetCurrent) {
        setIsTimerMatchedToAudio(false);
        isTimerMatchedToAudioRef.current = false;
        const targetSec = settings.timerTargetMinutes * 60;
        timerSecondsRef.current = targetSec;
        updateStateAndPersist((prev) => ({
          ...prev,
          timerSeconds: targetSec,
        }));
      }
    },
    [settings.timerTargetMinutes, updateSettings, updateStateAndPersist]
  );

  const matchAudio = useCallback(() => {
    const spd =
      playbackSpeedRef.current ||
      (audioRef.current ? audioRef.current.playbackRate : 1.0) ||
      settingsRef.current.defaultPlaybackSpeed ||
      1.0;
    const curDur =
      audioRef.current &&
      !isNaN(audioRef.current.duration) &&
      isFinite(audioRef.current.duration) &&
      audioRef.current.duration > 0
        ? audioRef.current.duration
        : durationRef.current > 0
        ? durationRef.current
        : currentJuzRef.current.approxDurationSeconds || 2776;
    const curPos =
      audioRef.current &&
      !isNaN(audioRef.current.currentTime) &&
      isFinite(audioRef.current.currentTime)
        ? audioRef.current.currentTime
        : playbackPosRef.current || 0;

    const rawTimeLeft = Math.max(0, Math.round(curDur - curPos));
    const adjustedTimeLeft = Math.round(rawTimeLeft / spd);

    recordAccident(
      "timer_reset",
      `Matched Big Timer to Audio: ${formatHeroTimer(adjustedTimeLeft)}${spd !== 1.0 ? ` (${spd}x speed)` : ""}`
    );
    timerSecondsRef.current = adjustedTimeLeft;
    setIsTimerMatchedToAudio(true);
    isTimerMatchedToAudioRef.current = true;
    updateStateAndPersist((prev) => ({
      ...prev,
      timerSeconds: adjustedTimeLeft,
    }));

    return { timeLeft: adjustedTimeLeft, speed: spd, rawTimeLeft };
  }, [recordAccident, updateStateAndPersist]);

  const setStreakTargetMinutes = useCallback(
    (minutes: number) => {
      const validMinutes = Math.max(1, Math.min(720, Math.round(minutes)));
      updateSettings({ streakTargetMinutes: validMinutes });
      updateStateAndPersist((prev) => ({
        ...prev,
        streakTargetMinutes: validMinutes,
      }));
    },
    [updateSettings, updateStateAndPersist]
  );

  // 1-Second Master Tick:
  // Tracks playback position every second, ticks the reading timer (only while audio plays),
  // records reading slot in 24h reading chart, checks midnight rollover, and updates user log.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlayingRef.current) return;

      const now = new Date();
      const todayStr = getLocalDateString(now);
      const currentSlot = getSlotIndexForDate(now);

      // Check Midnight Rollover (Requirement 3.2):
      // "The Timer resets at midnight each day to the default timer value.
      // If this happens while an audio file is playing let the audio file keep playing and work with the new timer value."
      const isNewDay = todayStr !== lastActiveDateRef.current;
      if (isNewDay) {
        lastActiveDateRef.current = todayStr;
      }

      // Read current audio position
      let currentPos = playbackPosRef.current;
      if (audioRef.current) {
        currentPos = audioRef.current.currentTime;
        setPlaybackPosition(currentPos);
        playbackPosRef.current = currentPos;
      }

      // Timer update:
      // Decrements by 1 every second while audio plays.
      // When matched to audio, it tracks remaining audio playback time in exact lockstep.
      // Otherwise, decrements by 1 every second while audio plays (strictly 1 second per real second).
      // When reaching 0 and beyond, it continues into negative seconds (-1, -2, -3...),
      // which formatHeroTimer formats with '+' and counts upwards in overtime.
      const targetSec = settings.timerTargetMinutes * 60;
      const streakTargetSec =
        (settings.streakTargetMinutes || settings.timerTargetMinutes || 30) * 60;
      let nextTimerSec = timerSecondsRef.current;

      if (isNewDay) {
        nextTimerSec = targetSec;
      } else if (isTimerMatchedToAudioRef.current) {
        // In Audio Match mode: calculate remaining playback time directly so Big Timer and Audio Match NEVER drift
        const curDur =
          audioRef.current &&
          !isNaN(audioRef.current.duration) &&
          isFinite(audioRef.current.duration) &&
          audioRef.current.duration > 0
            ? audioRef.current.duration
            : durationRef.current > 0
            ? durationRef.current
            : currentJuzRef.current.approxDurationSeconds || 2776;
        const spd = playbackSpeedRef.current || 1.0;
        nextTimerSec = Math.max(0, Math.round((curDur - currentPos) / spd));
      } else {
        // Standard countdown rate: strictly 1 second per real-time second regardless of playback speed
        nextTimerSec = nextTimerSec - 1;
      }
      timerSecondsRef.current = nextTimerSec;

      // Check if audio finished (backup trigger if ended event was missed)
      if (audioRef.current && isPlayingRef.current) {
        const ct = audioRef.current.currentTime;
        const dur = audioRef.current.duration || durationRef.current;
        if (dur && isFinite(dur) && dur > 60 && ct >= dur - 60) {
          triggerPreloadNext();
        }
        if (audioRef.current.ended || (dur && isFinite(dur) && dur > 5 && ct >= dur - 0.3)) {
          handleAudioEnded();
          return;
        }
      }

      // Update today's record and 15-minute slot reading duration
      updateStateAndPersist((prevState) => {
        const history = { ...(prevState.historyRecords || {}) };
        const existingToday = history[todayStr] || {
          date: todayStr,
          secondsRead: 0,
          targetReached: false,
          slots: {},
          juzCompletedCount: 0,
          completedJuzIds: [],
        };

        const updatedSecondsRead = (existingToday.secondsRead || 0) + 1;
        const currentSlotSec = (existingToday.slots?.[currentSlot] || 0) + 1;
        const slots = { ...(existingToday.slots || {}), [currentSlot]: currentSlotSec };

        const targetCompleted = updatedSecondsRead >= streakTargetSec;

        history[todayStr] = {
          ...existingToday,
          date: todayStr,
          secondsRead: updatedSecondsRead,
          targetReached: existingToday.targetReached || targetCompleted,
          slots,
        };

        return {
          ...prevState,
          playbackPositionSeconds: currentPos,
          timerSeconds: nextTimerSec,
          lastActiveDate: todayStr,
          historyRecords: history,
        };
      });

      // Append to rolling history buffer (last 5 minutes of continuous playback)
      recentHistoryRef.current.push({
        time: Date.now(),
        juzId: userStateRef.current.currentJuzId,
        position: currentPos,
        timerSeconds: nextTimerSec,
      });
      if (recentHistoryRef.current.length > 300) {
        recentHistoryRef.current.shift();
      }

      // Check periodic synch checkpoint every 5 minutes (300,000 ms)
      const currentSyncPoints = userStateRef.current.syncPoints || [];
      const lastPoint = currentSyncPoints[0];
      const lastPointTime = lastPoint ? new Date(lastPoint.timestamp).getTime() : 0;
      if (Date.now() - lastPointTime >= 300_000) {
        saveSyncPoint("Periodic Checkpoint (5m)");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.timerMode, settings.timerTargetMinutes, settings.streakTargetMinutes, updateStateAndPersist, saveSyncPoint]);

  // Seamless Track Advance: Move to the next Juz in the playlist
  const moveToNextJuz = useCallback(() => {
    saveSyncPoint("Completed Juz");
    const currentId = userStateRef.current.currentJuzId;
    const nextJuzId = currentId < 30 ? currentId + 1 : 1;
    const nextJuz = INITIAL_JUZ_LIST.find((j) => j.id === nextJuzId) || INITIAL_JUZ_LIST[0];
    const nextUrl = getAudioUrlForJuz(nextJuz);

    // 1. Log completion of current Juz
    const logEntry: UserLogEntry = {
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      juzId: currentId,
      juzName: juzName,
      durationSeconds: Math.floor(playbackPosRef.current),
      playbackSpeed: playbackSpeed,
      action: "complete_juz",
    };

    // 2. Timer Handling:
    // If matched to audio, set to next Juz duration divided by speed.
    // If autoTimerDurationMinutes is explicitly configured in settings, reset to that duration.
    // If not explicitly configured, and Big Timer has NOT expired (> 0), KEEP the remaining time!
    // If timer had already expired (<= 0), reset to default target.
    const autoMinutes = settingsRef.current.autoTimerDurationMinutes;
    let nextTimerSec = timerSecondsRef.current;
    if (isTimerMatchedToAudioRef.current) {
      const activeSpd = playbackSpeedRef.current || 1.0;
      nextTimerSec = Math.round((nextJuz.approxDurationSeconds || 2776) / activeSpd);
      timerSecondsRef.current = nextTimerSec;
    } else if (autoMinutes !== undefined && autoMinutes !== null && autoMinutes > 0) {
      nextTimerSec = settingsRef.current.timerMode === "countdown" ? autoMinutes * 60 : 0;
      timerSecondsRef.current = nextTimerSec;
    } else if (timerSecondsRef.current <= 0) {
      const defaultMinutes = settingsRef.current.timerTargetMinutes || 30;
      nextTimerSec = settingsRef.current.timerMode === "countdown" ? defaultMinutes * 60 : 0;
      timerSecondsRef.current = nextTimerSec;
    }

    // 3. Atomically update completed Juzes, daily tally, Khatm plan and advance to nextJuzId
    const todayStr = getLocalDateString();
    updateStateAndPersist((s) => {
      const currentCompleted = s.completedJuzs || [];
      const nextCompleted = currentCompleted.includes(currentId)
        ? currentCompleted
        : [...currentCompleted, currentId].sort((a, b) => a - b);
      const nextTally = (s.juzTally || 0) + 1;

      const history = { ...(s.historyRecords || {}) };
      const existingToday = history[todayStr] || {
        date: todayStr,
        secondsRead: 0,
        targetReached: false,
        slots: {},
        juzCompletedCount: 0,
        completedJuzIds: [],
      };

      const existingJuzIds = existingToday.completedJuzIds || [];
      const nextTodayCompletedJuzIds = [...existingJuzIds, currentId];
      const nextTodayJuzCount = (existingToday.juzCompletedCount || 0) + 1;

      history[todayStr] = {
        ...existingToday,
        targetReached: true, // Completing a Juz fulfills streak for the day
        juzCompletedCount: nextTodayJuzCount,
        completedJuzIds: nextTodayCompletedJuzIds,
      };

      // Handle Khatm plan progress if active
      let nextKhatm = s.khatmPlan || settingsRef.current.khatmPlan;
      if (nextKhatm && !nextKhatm.isCompleted) {
        const matchingDays: number[] = [];
        for (let d = 0; d < nextKhatm.durationDays; d++) {
          const fromOffset = Math.floor(d * nextKhatm.amountPerDay);
          const toOffset = Math.max(fromOffset + 1, Math.floor((d + 1) * nextKhatm.amountPerDay));
          for (let k = fromOffset; k < toOffset; k++) {
            const jId = ((nextKhatm.startJuz - 1 + k) % 30) + 1;
            if (jId === currentId) {
              matchingDays.push(d);
            }
          }
        }
        if (matchingDays.length > 0) {
          const currentDays = nextKhatm.completedDays || [];
          const combinedDays = Array.from(new Set([...currentDays, ...matchingDays])).sort((a, b) => a - b);
          nextKhatm = {
            ...nextKhatm,
            completedDays: combinedDays,
            isCompleted: combinedDays.length >= nextKhatm.durationDays,
            updatedAt: new Date().toISOString(),
          };
          saveStoredSettings({
            ...settingsRef.current,
            khatmPlan: nextKhatm,
          });
        }
      }

      return {
        ...s,
        currentJuzId: nextJuzId,
        playbackPositionSeconds: 0,
        timerSeconds: nextTimerSec,
        completedJuzs: nextCompleted,
        juzTally: nextTally,
        historyRecords: history,
        userLogs: [logEntry, ...(s.userLogs || [])].slice(0, 500),
        khatmPlan: nextKhatm,
        isPlaying: true,
      };
    });

    // 4. Reset position tracking & preload cache tracking
    setPlaybackPosition(0);
    playbackPosRef.current = 0;
    preloadedJuzIdRef.current = null;

    // 5. Directly transition and play the next audio file
    if (audioRef.current) {
      // Release background preload element to avoid concurrent connection contention
      if (preloadAudioRef.current) {
        preloadAudioRef.current.removeAttribute("src");
        preloadAudioRef.current.load();
      }

      audioRef.current.pause();
      audioRef.current.src = nextUrl;
      audioRef.current.currentTime = 0;
      const activeSpd = playbackSpeedRef.current || playbackSpeed || 1.0;
      audioRef.current.playbackRate = activeSpd;
      audioRef.current.defaultPlaybackRate = activeSpd;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            isPlayingRef.current = true;
            isTransitioningRef.current = false;
            broadcastPlayback("PLAY", { juzId: nextJuzId, position: 0 });
          })
          .catch((err) => {
            if (err.name === "AbortError") {
              return;
            }
            console.warn("Auto-play next track error:", err);
            setIsPlaying(false);
            isPlayingRef.current = false;
            isTransitioningRef.current = false;
          });
      } else {
        setIsPlaying(true);
        isPlayingRef.current = true;
        isTransitioningRef.current = false;
      }
    }
  }, [
    juzName,
    playbackSpeed,
    getAudioUrlForJuz,
    updateStateAndPersist,
    broadcastPlayback,
    saveSyncPoint,
  ]);

  // Audio Ended Handler: Automatic Playlist Continuous Playback
  const handleAudioEnded = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    saveSyncPoint("Audio Stopped (Track Finished)");
    moveToNextJuz();
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 2000);
  }, [moveToNextJuz, saveSyncPoint]);

  // Juz Checklist: Tap to mark done or undone
  const toggleJuzCompleted = useCallback(
    (juzId: number) => {
      const todayStr = getLocalDateString();
      updateStateAndPersist((s) => {
        const currentCompleted = s.completedJuzs || [];
        const isDone = currentCompleted.includes(juzId);
        let nextCompleted: number[];
        let nextTally: number;

        const history = { ...s.historyRecords };
        const existingToday = history[todayStr] || {
          date: todayStr,
          secondsRead: 0,
          targetReached: false,
          slots: {},
          juzCompletedCount: 0,
          completedJuzIds: [],
        };

        if (isDone) {
          nextCompleted = currentCompleted.filter((id) => id !== juzId);
          nextTally = Math.max(0, (s.juzTally || 1) - 1);

          const filteredTodayIds = (existingToday.completedJuzIds || []).filter(
            (id) => id !== juzId
          );
          history[todayStr] = {
            ...existingToday,
            completedJuzIds: filteredTodayIds,
            juzCompletedCount: Math.max(0, (existingToday.juzCompletedCount || 1) - 1),
          };
        } else {
          nextCompleted = [...currentCompleted, juzId].sort((a, b) => a - b);
          nextTally = (s.juzTally || 0) + 1;

          const nextTodayIds = [...(existingToday.completedJuzIds || []), juzId];
          history[todayStr] = {
            ...existingToday,
            targetReached: true,
            completedJuzIds: nextTodayIds,
            juzCompletedCount: (existingToday.juzCompletedCount || 0) + 1,
          };
        }

        return {
          ...s,
          completedJuzs: nextCompleted,
          juzTally: nextTally,
          historyRecords: history,
        };
      });
      syncWithServer();
    },
    [updateStateAndPersist, syncWithServer]
  );

  // Manual Adjustments in Settings
  const setJuzTallyManually = useCallback(
    (tally: number, completedIds?: number[]) => {
      const validTally = Math.max(0, Math.round(tally));
      updateStateAndPersist((s) => ({
        ...s,
        juzTally: validTally,
        ...(completedIds ? { completedJuzs: completedIds } : {}),
      }));
      syncWithServer();
    },
    [updateStateAndPersist, syncWithServer]
  );

  const setTodayJuzCountManually = useCallback(
    (count: number) => {
      const validCount = Math.max(0, Math.round(count));
      const todayStr = getLocalDateString();
      updateStateAndPersist((s) => {
        const history = { ...s.historyRecords };
        const existing = history[todayStr] || {
          date: todayStr,
          secondsRead: 0,
          targetReached: false,
          slots: {},
          juzCompletedCount: 0,
          completedJuzIds: [],
        };
        history[todayStr] = {
          ...existing,
          juzCompletedCount: validCount,
          targetReached: validCount > 0 ? true : existing.targetReached,
        };
        return {
          ...s,
          historyRecords: history,
        };
      });
      syncWithServer();
    },
    [updateStateAndPersist, syncWithServer]
  );

  const setCompletedStreakDaysManually = useCallback(
    (daysCount: number) => {
      const clampedDays = Math.max(0, Math.min(30, Math.round(daysCount)));
      const today = new Date();
      updateStateAndPersist((s) => {
        const history = { ...s.historyRecords };
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dStr = getLocalDateString(d);
          const existing = history[dStr] || {
            date: dStr,
            secondsRead: 0,
            targetReached: false,
            slots: {},
            juzCompletedCount: 0,
            completedJuzIds: [],
          };
          const shouldBeCompleted = i < clampedDays;
          history[dStr] = {
            ...existing,
            targetReached: shouldBeCompleted,
            juzCompletedCount: shouldBeCompleted
              ? Math.max(1, existing.juzCompletedCount || 1)
              : 0,
          };
        }
        return {
          ...s,
          historyRecords: history,
        };
      });
      syncWithServer();
    },
    [updateStateAndPersist, syncWithServer]
  );

  const setTallyAndStreakProgressManually = useCallback(
    ({
      tally,
      completedIds,
      streakDays,
      todayJuzCount,
      targetDate,
      dateJuzCount,
      dateJuzCounts,
    }: {
      tally: number;
      completedIds?: number[];
      streakDays?: number;
      todayJuzCount?: number;
      targetDate?: string;
      dateJuzCount?: number;
      dateJuzCounts?: Record<string, number>;
    }) => {
      const validTally = Math.max(0, Math.round(tally));
      const today = new Date();
      const todayStr = getLocalDateString(today);

      updateStateAndPersist((s) => {
        const history = { ...s.historyRecords };

        if (streakDays !== undefined) {
          const clampedDays = Math.max(0, Math.min(30, Math.round(streakDays)));
          for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dStr = getLocalDateString(d);
            const existing = history[dStr] || {
              date: dStr,
              secondsRead: 0,
              targetReached: false,
              slots: {},
              juzCompletedCount: 0,
              completedJuzIds: [],
            };
            const shouldBeCompleted = i < clampedDays;
            history[dStr] = {
              ...existing,
              targetReached: shouldBeCompleted,
            };
          }
        }

        // Apply any dictionary of multiple date counts
        if (dateJuzCounts) {
          Object.entries(dateJuzCounts).forEach(([dStr, count]) => {
            const validCount = Math.max(0, Math.round(count));
            const existing = history[dStr] || {
              date: dStr,
              secondsRead: 0,
              targetReached: false,
              slots: {},
              juzCompletedCount: 0,
              completedJuzIds: [],
            };
            history[dStr] = {
              ...existing,
              juzCompletedCount: validCount,
            };
          });
        }

        // Apply single date count if provided
        if (targetDate && dateJuzCount !== undefined) {
          const validCount = Math.max(0, Math.round(dateJuzCount));
          const existing = history[targetDate] || {
            date: targetDate,
            secondsRead: 0,
            targetReached: false,
            slots: {},
            juzCompletedCount: 0,
            completedJuzIds: [],
          };
          history[targetDate] = {
            ...existing,
            juzCompletedCount: validCount,
          };
        } else if (todayJuzCount !== undefined && !dateJuzCounts) {
          const validTodayCount = Math.max(0, Math.round(todayJuzCount));
          const existingToday = history[todayStr] || {
            date: todayStr,
            secondsRead: 0,
            targetReached: false,
            slots: {},
            juzCompletedCount: 0,
            completedJuzIds: [],
          };
          history[todayStr] = {
            ...existingToday,
            juzCompletedCount: validTodayCount,
          };
        }

        return {
          ...s,
          juzTally: validTally,
          ...(completedIds ? { completedJuzs: completedIds } : {}),
          historyRecords: history,
        };
      });
      syncWithServer();
    },
    [updateStateAndPersist, syncWithServer]
  );

  const toggleDayStreakManually = useCallback(
    (dateStr: string) => {
      const todayStr = getLocalDateString();
      if (dateStr > todayStr) {
        // You cannot complete it prior to that day
        return;
      }
      updateStateAndPersist((s) => {
        const history = { ...s.historyRecords };
        const existing = history[dateStr] || {
          date: dateStr,
          secondsRead: 0,
          targetReached: false,
          slots: {},
          juzCompletedCount: 0,
          completedJuzIds: [],
        };
        const wasCompleted = (existing.juzCompletedCount || 0) >= 1;
        const nextCompleted = !wasCompleted;
        history[dateStr] = {
          ...existing,
          targetReached: nextCompleted,
          juzCompletedCount: nextCompleted
            ? Math.max(1, existing.juzCompletedCount || 1)
            : 0,
        };
        return {
          ...s,
          historyRecords: history,
        };
      });
      syncWithServer();
    },
    [updateStateAndPersist, syncWithServer]
  );

  // Khatm Planner Helpers
  const saveKhatmPlan = useCallback(
    (plan: KhatmPlan) => {
      const updatedPlan: KhatmPlan = {
        ...plan,
        updatedAt: new Date().toISOString(),
      };
      updateSettings({ khatmPlan: updatedPlan });
      updateStateAndPersist((s) => ({
        ...s,
        khatmPlan: updatedPlan,
      }));
      syncWithServer();
    },
    [updateSettings, updateStateAndPersist, syncWithServer]
  );

  const toggleKhatmDayCompleted = useCallback(
    (dayIndex: number) => {
      updateStateAndPersist((s) => {
        const plan = s.khatmPlan || settingsRef.current.khatmPlan;
        if (!plan) return s;
        const currentCompleted = plan.completedDays || [];
        const isCompleted = currentCompleted.includes(dayIndex);
        const nextCompleted = isCompleted
          ? currentCompleted.filter((i) => i !== dayIndex)
          : [...currentCompleted, dayIndex].sort((a, b) => a - b);

        const isAllFinished = nextCompleted.length >= plan.durationDays;
        const updatedPlan: KhatmPlan = {
          ...plan,
          completedDays: nextCompleted,
          isCompleted: isAllFinished,
          updatedAt: new Date().toISOString(),
        };

        saveStoredSettings({
          ...settingsRef.current,
          khatmPlan: updatedPlan,
        });

        return {
          ...s,
          khatmPlan: updatedPlan,
        };
      });
      syncWithServer();
    },
    [updateStateAndPersist, syncWithServer]
  );

  const deleteKhatmPlan = useCallback(() => {
    updateSettings({ khatmPlan: null });
    updateStateAndPersist((s) => ({
      ...s,
      khatmPlan: null,
    }));
    syncWithServer();
  }, [updateSettings, updateStateAndPersist, syncWithServer]);

  const resetKhatmPlanProgress = useCallback(() => {
    updateStateAndPersist((s) => {
      const plan = s.khatmPlan || settingsRef.current.khatmPlan;
      if (!plan) return s;
      const updatedPlan: KhatmPlan = {
        ...plan,
        completedDays: [],
        isCompleted: false,
        updatedAt: new Date().toISOString(),
      };
      saveStoredSettings({
        ...settingsRef.current,
        khatmPlan: updatedPlan,
      });
      return {
        ...s,
        khatmPlan: updatedPlan,
      };
    });
    syncWithServer();
  }, [updateStateAndPersist, syncWithServer]);

  // MediaSession API Integration (Lock Screen, Notification, Headphone buttons)
  useEffect(() => {
    if (typeof window !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: juzName,
        artist: "Maher Al Muaiqly",
        album: "The Holy Quran - 30 Juzs",
        artwork: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });

      navigator.mediaSession.setActionHandler("play", play);
      navigator.mediaSession.setActionHandler("pause", pause);
      navigator.mediaSession.setActionHandler("seekbackward", rewind);
      navigator.mediaSession.setActionHandler("seekforward", fastForward);
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        const prevId = currentJuz.id > 1 ? currentJuz.id - 1 : 30;
        confirmJuzSwitch(prevId);
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        const nextId = currentJuz.id < 30 ? currentJuz.id + 1 : 1;
        confirmJuzSwitch(nextId);
      });
    }
  }, [juzName, currentJuz.id, play, pause, rewind, fastForward, confirmJuzSwitch]);

  // User Auth Actions
  const generateRandomUser = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/auth?action=random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: userStateRef.current, settings: settingsRef.current }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const merged = reconcileStates(userStateRef.current, data.state);
        setUserState(merged);
        userStateRef.current = merged;
        saveStoredState(merged);
        setLastSynced(new Date().toLocaleTimeString());
        return { success: true, credentials: data.randomCredentials };
      }
      return { success: false, error: data.error || "Failed to generate random account" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const registerUser = useCallback(
    async (username: string, email: string, password?: string) => {
      setIsSyncing(true);
      try {
        const res = await fetch("/api/auth?action=register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            email,
            password: password || "ql-" + Math.random().toString(36).substring(2, 10),
            state: userStateRef.current,
            settings: settingsRef.current,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          const merged = reconcileStates(userStateRef.current, data.state);
          setUserState(merged);
          userStateRef.current = merged;
          saveStoredState(merged);
          setLastSynced(new Date().toLocaleTimeString());
          return { success: true };
        }
        return { success: false, error: data.error || "Registration failed" };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error" };
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const loginUser = useCallback(async (email: string, password?: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: password || "",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const merged = reconcileStates(userStateRef.current, data.state);
        setUserState(merged);
        userStateRef.current = merged;
        saveStoredState(merged);
        setPlaybackPosition(merged.playbackPositionSeconds);
        playbackPosRef.current = merged.playbackPositionSeconds;

        if (data.settings) {
          const mergedSettings = reconcileSettings(settingsRef.current, data.settings);
          setSettings(mergedSettings);
          settingsRef.current = mergedSettings;
          saveStoredSettings(mergedSettings);
          if (mergedSettings.defaultPlaybackSpeed && audioRef.current) {
            audioRef.current.playbackRate = mergedSettings.defaultPlaybackSpeed;
          }
        }

        if (merged.currentJuzId && audioRef.current) {
          const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === merged.currentJuzId) || INITIAL_JUZ_LIST[0];
          const targetUrl = getAudioUrlForJuz(targetJuz);
          if (!isSameAudioUrl(audioRef.current.src, targetUrl)) {
            audioRef.current.src = targetUrl;
          }
          audioRef.current.currentTime = merged.playbackPositionSeconds || 0;
        }

        setLastSynced(new Date().toLocaleTimeString());
        return { success: true };
      }
      return { success: false, error: data.error || "Invalid email or password" };
    } catch (err: any) {
      return { success: false, error: err.message || "Network error" };
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const resetAccountDetails = useCallback(
    async (payload: AccountResetPayload) => {
      setIsSyncing(true);
      try {
        const res = await fetch("/api/auth?action=reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setUserState((prev) => {
            const updated: UserState = {
              ...prev,
              userName: data.user?.username || prev.userName,
              userEmail: data.user?.email || prev.userEmail,
              ...(payload.resetReadingData
                ? {
                    currentJuzId: 1,
                    playbackPositionSeconds: 0,
                    timerSeconds: 1800,
                    historyRecords: {},
                    userLogs: [],
                  }
                : {}),
              updatedAt: new Date().toISOString(),
            };
            userStateRef.current = updated;
            saveStoredState(updated);
            return updated;
          });

          if (payload.resetReadingData) {
            setPlaybackPosition(0);
            playbackPosRef.current = 0;
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
            }
          }

          setLastSynced(new Date().toLocaleTimeString());
          return { success: true, message: data.message };
        }
        return { success: false, error: data.error || "Failed to reset account details" };
      } catch (err: any) {
        return { success: false, error: err.message || "Network error" };
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const logoutUser = useCallback(async () => {
    try {
      await fetch("/api/auth?action=logout", { method: "POST" });
    } catch {}

    const loggedOutState: UserState = {
      ...userStateRef.current,
      isLoggedIn: false,
      userEmail: "",
      userName: "Guest User",
      updatedAt: new Date().toISOString(),
    };
    setUserState(loggedOutState);
    userStateRef.current = loggedOutState;
    saveStoredState(loggedOutState);
    setLastSynced(null);
  }, []);

  // Today's reading record
  const todayKey = getLocalDateString();
  const records = userState.historyRecords || {};
  const todayRecord: DayReadingRecord = records[todayKey] || {
    date: todayKey,
    secondsRead: 0,
    targetReached: false,
    slots: {},
    juzCompletedCount: 0,
    completedJuzIds: [],
  };

  return (
    <AppContext.Provider
      value={{
        juzList,
        currentJuz,
        currentJuzId: userState.currentJuzId,
        juzName,
        juzRange,
        isPlaying,
        playbackPosition,
        duration,
        playbackSpeed,
        audioRef,
        play,
        pause,
        togglePlay,
        seekTo,
        rewind,
        fastForward,
        resetTrack,
        setSpeed,
        selectJuz,
        confirmJuzSwitch,
        pendingJuzSwitch,
        cancelJuzSwitch,
        timerSeconds: userState.timerSeconds,
        timerTargetMinutes: settings.timerTargetMinutes,
        timerMode: settings.timerMode,
        isTimerRunning: isPlaying,
        resetTimer,
        setTimerSeconds,
        adjustTimerDefault,
        setTimerMode,
        matchAudio,
        isTimerMatchedToAudio,
        settings,
        updateSettings,
        themeMode: settings.themeMode,
        themeColor: settings.themeColor,
        resolvedTheme,
        toggleThemeMode,
        setThemeMode,
        setThemeColor,
        historyRecords: userState.historyRecords || {},
        todayRecord,
        streakTargetMinutes: settings.streakTargetMinutes ?? settings.timerTargetMinutes ?? 30,
        setStreakTargetMinutes,
        userLogs: userState.userLogs || [],
        completedJuzs: userState.completedJuzs || [],
        juzTally: userState.juzTally ?? (userState.completedJuzs ? userState.completedJuzs.length : 0),
        toggleJuzCompleted,
        setJuzTallyManually,
        setTodayJuzCountManually,
        setCompletedStreakDaysManually,
        setTallyAndStreakProgressManually,
        toggleDayStreakManually,
        khatmPlan: userState.khatmPlan || settings.khatmPlan || null,
        saveKhatmPlan,
        toggleKhatmDayCompleted,
        deleteKhatmPlan,
        resetKhatmPlanProgress,
        userState,
        loginUser,
        registerUser,
        generateRandomUser,
        resetAccountDetails,
        logoutUser,
        isSyncing,
        lastSynced,
        manualSync,
        syncNotice,
        syncPoints: userState.syncPoints || [],
        saveSyncPoint,
        rollbackToSyncPoint,
        rollbackToAccidentFifteenSeconds,
        lastAccident,
        isLastSyncPointOlderThan1Min,
        isRollBackOpen,
        setIsRollBackOpen,
        openRollBack,
        closeRollBack,
      }}
    >
      {/* Underlying Audio Element with CDN Fallback Error Handling */}
      {/* Note: src is managed via the audio sync useEffect & imperative controls rather than a JSX attribute */}
      {/* to prevent React virtual DOM re-renders from re-assigning .src and aborting active playback. */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(e) => {
          const ct = e.currentTarget.currentTime;
          const dur = e.currentTarget.duration;
          setPlaybackPosition(ct);
          playbackPosRef.current = ct;
          if (dur && isFinite(dur) && dur > 60 && ct >= dur - 60) {
            triggerPreloadNext();
          }
          if (dur && isFinite(dur) && dur > 5 && ct >= dur - 0.3) {
            handleAudioEnded();
          }
        }}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (d && !isNaN(d) && isFinite(d)) {
            setDuration(d);
            durationRef.current = d;
          }
          if (playbackSpeed) {
            e.currentTarget.playbackRate = playbackSpeed;
          }
          const activeSpd = playbackSpeedRef.current || playbackSpeed || 1.0;
          e.currentTarget.playbackRate = activeSpd;
          e.currentTarget.defaultPlaybackRate = activeSpd;
          // Restore position if restoring progress (> 0)
          const targetPos = playbackPosRef.current;
          if (targetPos > 0 && Math.abs(e.currentTarget.currentTime - targetPos) > 1) {
            e.currentTarget.currentTime = targetPos;
          }
        }}
        onPause={(e) => {
          if (isPlayingRef.current && !isTransitioningRef.current) {
            setIsPlaying(false);
            isPlayingRef.current = false;
            const currentPos = e.currentTarget.currentTime;
            setPlaybackPosition(currentPos);
            playbackPosRef.current = currentPos;
            saveSyncPoint("Audio Stopped");
          }
        }}
        onEnded={handleAudioEnded}
        onError={(e) => {
          console.warn("Audio source load error, falling back to CDN stream:", e);
          if (settings.preferLocalAudio && !failedLocalJuzs[currentJuz.id]) {
            setFailedLocalJuzs((prev) => ({ ...prev, [currentJuz.id]: true }));
          }
        }}
      />
      {/* Background Preload Audio Element to warm up and buffer upcoming track */}
      <audio
        ref={preloadAudioRef}
        preload="none"
        style={{ display: "none" }}
        aria-hidden="true"
        muted
      />
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

