"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import {
  AccountResetPayload,
  AppSettings,
  DayReadingRecord,
  JuzInfo,
  PlaybackSpeed,
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
} from "../lib/storage";
import { getLocalDateString, getSlotIndexForDate } from "../lib/utils";

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
  adjustTimerDefault: (minutes: number, resetCurrent?: boolean) => void;
  setTimerMode: (mode: TimerMode, resetCurrent?: boolean) => void;

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
  historyRecords: Record<string, DayReadingRecord>;
  todayRecord: DayReadingRecord;
  userLogs: UserLogEntry[];

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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [userState, setUserState] = useState<UserState>(INITIAL_USER_STATE);
  const [isClient, setIsClient] = useState(false);

  // Audio state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(3300);
  const [playbackSpeed, setPlaybackSpeedState] = useState<PlaybackSpeed>(1.0);
  const [pendingJuzSwitch, setPendingJuzSwitch] = useState<number | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // References for interval tracking
  // References for interval tracking and stale-closure prevention
  const lastActiveDateRef = useRef(getLocalDateString());
  const timerSecondsRef = useRef(userState.timerSeconds);
  const playbackPosRef = useRef(0);
  const isPlayingRef = useRef(false);
  const userStateRef = useRef(userState);
  const settingsRef = useRef(settings);

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
          const merged = reconcileStates(loadedState, data.state);
          setUserState(merged);
          userStateRef.current = merged;
          saveStoredState(merged);
          if (merged.playbackPositionSeconds > 0) {
            setPlaybackPosition(merged.playbackPositionSeconds);
            playbackPosRef.current = merged.playbackPositionSeconds;
          }
          setLastSynced(new Date().toLocaleTimeString());
        }
      })
      .catch((e) => console.warn("Session check skipped/offline:", e));
  }, []);

  // Construct active Juz list with custom overrides
  const juzList: JuzInfo[] = INITIAL_JUZ_LIST.map((j) => ({
    ...j,
    customName: settings.customJuzNames[j.id] || undefined,
    customRange: settings.customJuzRanges[j.id] || undefined,
  }));

  const currentJuz =
    juzList.find((j) => j.id === userState.currentJuzId) || juzList[0];

  const juzName = currentJuz.customName || currentJuz.defaultName;
  const juzRange = currentJuz.customRange || currentJuz.defaultRange;


  // Determine active audio URL:
  // Compressed audio files (~10MB) are stored directly with the app in public/audio/juz/
  // and served by Cloudflare Workers. cdnAudioUrl is used as fallback.
  const activeAudioUrl = currentJuz.localAudioUrl;

  // Update Settings
  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveStoredSettings(next);
      return next;
    });
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

  // Unified Sync with Cloudflare D1
  const syncWithServer = useCallback(async (customState?: UserState) => {
    const currentState = customState || userStateRef.current;
    if (!currentState.isLoggedIn) return;

    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: currentState, settings: settingsRef.current }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.remoteState) {
          const reconciled = reconcileStates(currentState, data.remoteState);
          setUserState(reconciled);
          userStateRef.current = reconciled;
          saveStoredState(reconciled);
          if (reconciled.currentJuzId !== currentState.currentJuzId) {
            setPlaybackPosition(reconciled.playbackPositionSeconds);
            playbackPosRef.current = reconciled.playbackPositionSeconds;
          }
        }
        setLastSynced(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn("Background sync offline/failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const manualSync = useCallback(async () => {
    await syncWithServer();
  }, [syncWithServer]);

  // Periodic Auto-Sync during active playback (every 20 seconds)
  useEffect(() => {
    if (!isPlaying || !userState.isLoggedIn) return;

    const interval = setInterval(() => {
      syncWithServer();
    }, 20000);

    return () => clearInterval(interval);
  }, [isPlaying, userState.isLoggedIn, syncWithServer]);

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

  // Audio Playback Controls
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn("Playback error:", e));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      // Immediately sync state to server on pause
      setTimeout(() => {
        syncWithServer();
      }, 50);
    }
  }, [syncWithServer]);

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
      if (audioRef.current) {
        audioRef.current.currentTime = targetSec;
      }
      setPlaybackPosition(targetSec);
      playbackPosRef.current = targetSec;
      updateStateAndPersist((s) => ({
        ...s,
        playbackPositionSeconds: targetSec,
      }));
    },
    [duration, updateStateAndPersist]
  );

  const rewind = useCallback(() => {
    seekTo(playbackPosition - settings.rewindStepSeconds);
  }, [playbackPosition, settings.rewindStepSeconds, seekTo]);

  const fastForward = useCallback(() => {
    seekTo(playbackPosition + settings.forwardStepSeconds);
  }, [playbackPosition, settings.forwardStepSeconds, seekTo]);

  const resetTrack = useCallback(() => {
    seekTo(0);
  }, [seekTo]);

  const setSpeed = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeedState(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  // Dropdown Juz Selection with Confirmation Prompt
  const selectJuz = useCallback(
    (juzId: number) => {
      if (juzId === userState.currentJuzId) return;
      if (isPlaying) {
        // Confirm with user before interrupting active playback
        setPendingJuzSwitch(juzId);
      } else {
        confirmJuzSwitch(juzId);
      }
    },
    [isPlaying, userState.currentJuzId]
  );

  const confirmJuzSwitch = useCallback(
    (juzId: number) => {
      setPendingJuzSwitch(null);
      setPlaybackPosition(0);
      playbackPosRef.current = 0;
      updateStateAndPersist((s) => ({
        ...s,
        currentJuzId: juzId,
        playbackPositionSeconds: 0,
      }));
      // Reset audio element
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      // Resume playback after switch
      setTimeout(() => {
        play();
        syncWithServer();
      }, 100);
    },
    [updateStateAndPersist, play, syncWithServer]
  );

  const cancelJuzSwitch = useCallback(() => {
    setPendingJuzSwitch(null);
  }, []);

  const resetTimer = useCallback(() => {
    const targetSec =
      settings.timerMode === "countdown" ? settings.timerTargetMinutes * 60 : 0;
    timerSecondsRef.current = targetSec;
    updateStateAndPersist((prev) => ({
      ...prev,
      timerSeconds: targetSec,
    }));
  }, [settings.timerMode, settings.timerTargetMinutes, updateStateAndPersist]);

  const adjustTimerDefault = useCallback(
    (targetMinutes: number, resetCurrent: boolean = true) => {
      const validMinutes = Math.max(1, Math.min(720, Math.round(targetMinutes)));
      updateSettings({ timerTargetMinutes: validMinutes });
      if (resetCurrent) {
        const targetSec =
          settings.timerMode === "countdown" ? validMinutes * 60 : 0;
        timerSecondsRef.current = targetSec;
        updateStateAndPersist((prev) => ({
          ...prev,
          timerSeconds: targetSec,
        }));
      }
    },
    [settings.timerMode, updateSettings, updateStateAndPersist]
  );

  const setTimerMode = useCallback(
    (mode: TimerMode, resetCurrent: boolean = false) => {
      updateSettings({ timerMode: mode });
      if (resetCurrent) {
        const targetSec =
          mode === "countdown" ? settings.timerTargetMinutes * 60 : 0;
        timerSecondsRef.current = targetSec;
        updateStateAndPersist((prev) => ({
          ...prev,
          timerSeconds: targetSec,
        }));
      }
    },
    [settings.timerTargetMinutes, updateSettings, updateStateAndPersist]
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
      // In countdown mode: decreases until 0
      // In countup mode: increases until target reached
      const targetSec = settings.timerTargetMinutes * 60;
      let nextTimerSec = timerSecondsRef.current;

      if (isNewDay) {
        nextTimerSec = settings.timerMode === "countdown" ? targetSec : 0;
      } else {
        if (settings.timerMode === "countdown") {
          nextTimerSec = Math.max(0, nextTimerSec - 1);
        } else {
          nextTimerSec = nextTimerSec + 1;
        }
      }
      timerSecondsRef.current = nextTimerSec;

      // Update today's record and 15-minute slot reading duration
      updateStateAndPersist((prevState) => {
        const history = { ...prevState.historyRecords };
        const existingToday = history[todayStr] || {
          date: todayStr,
          secondsRead: 0,
          targetReached: false,
          slots: {},
        };

        const updatedSecondsRead = existingToday.secondsRead + 1;
        const currentSlotSec = (existingToday.slots[currentSlot] || 0) + 1;
        const slots = { ...existingToday.slots, [currentSlot]: currentSlotSec };

        const targetCompleted = updatedSecondsRead >= targetSec;

        history[todayStr] = {
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
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.timerMode, settings.timerTargetMinutes, updateStateAndPersist]);

  // Audio Ended Handler: Automatic Playlist Continuous Playback
  const handleAudioEnded = useCallback(() => {
    // Log completion
    const logEntry: UserLogEntry = {
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      juzId: currentJuz.id,
      juzName: juzName,
      durationSeconds: Math.floor(playbackPosition),
      playbackSpeed: playbackSpeed,
      action: "complete_juz",
    };

    updateStateAndPersist((s) => ({
      ...s,
      userLogs: [logEntry, ...(s.userLogs || [])].slice(0, 500),
    }));

    // Transition to next Juz seamlessly
    const nextJuzId = currentJuz.id < 30 ? currentJuz.id + 1 : 1;
    confirmJuzSwitch(nextJuzId);
  }, [currentJuz.id, juzName, playbackPosition, playbackSpeed, updateStateAndPersist, confirmJuzSwitch]);

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
  const todayRecord: DayReadingRecord = userState.historyRecords[todayKey] || {
    date: todayKey,
    secondsRead: 0,
    targetReached: false,
    slots: {},
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
        adjustTimerDefault,
        setTimerMode,
        settings,
        updateSettings,
        themeMode: settings.themeMode,
        themeColor: settings.themeColor,
        resolvedTheme,
        toggleThemeMode,
        setThemeMode,
        setThemeColor,
        historyRecords: userState.historyRecords,
        todayRecord,
        userLogs: userState.userLogs || [],
        userState,
        loginUser,
        registerUser,
        generateRandomUser,
        resetAccountDetails,
        logoutUser,
        isSyncing,
        lastSynced,
        manualSync,
      }}
    >
      {/* Underlying Audio Element with CDN Fallback Error Handling */}
      <audio
        ref={audioRef}
        src={activeAudioUrl}
        preload="metadata"
        onTimeUpdate={(e) => {
          const ct = e.currentTarget.currentTime;
          setPlaybackPosition(ct);
        }}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (d && !isNaN(d) && isFinite(d)) {
            setDuration(d);
          }
          // Restore position if loading fresh
          if (playbackPosition > 0 && Math.abs(e.currentTarget.currentTime - playbackPosition) > 2) {
            e.currentTarget.currentTime = playbackPosition;
          }
        }}
        onEnded={handleAudioEnded}
        onError={(e) => {
          console.warn("Audio source load error, falling back to CDN stream:", e);
          if (audioRef.current && audioRef.current.src !== currentJuz.cdnAudioUrl) {
            audioRef.current.src = currentJuz.cdnAudioUrl;
            audioRef.current.load();
            if (isPlaying) {
              audioRef.current.play().catch(() => {});
            }
          }
        }}
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

