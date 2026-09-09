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
  getDeviceId,
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
  setCompletedStreakDaysManually: (daysCount: number) => void;
  toggleDayStreakManually: (dateStr: string) => void;

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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [userState, setUserState] = useState<UserState>(INITIAL_USER_STATE);
  const [isClient, setIsClient] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

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
    if (loadedSettings.defaultPlaybackSpeed) {
      setPlaybackSpeedState(loadedSettings.defaultPlaybackSpeed);
      if (audioRef.current) {
        audioRef.current.playbackRate = loadedSettings.defaultPlaybackSpeed;
      }
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
    if (partial.defaultPlaybackSpeed !== undefined) {
      setPlaybackSpeedState(partial.defaultPlaybackSpeed);
      if (audioRef.current) {
        audioRef.current.playbackRate = partial.defaultPlaybackSpeed;
      }
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
  }, []);

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

            if (targetJuzId !== currentState.currentJuzId) {
              const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === targetJuzId) || INITIAL_JUZ_LIST[0];
              if (audioRef.current && audioRef.current.src !== targetJuz.localAudioUrl) {
                audioRef.current.src = targetJuz.localAudioUrl;
              }
            }

            if (audioRef.current && (!isPlayingRef.current || options?.isStartingPlayback)) {
              audioRef.current.currentTime = targetPos;
            }
            setPlaybackPosition(targetPos);
            playbackPosRef.current = targetPos;
          }
          setLastSynced(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.warn("Background sync offline/failed:", err);
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const manualSync = useCallback(async () => {
    if (userStateRef.current.isLoggedIn) {
      await syncWithServer();
    }
    const targetSec = settingsRef.current.timerTargetMinutes * 60;
    timerSecondsRef.current = targetSec;
    const nextState = {
      ...userStateRef.current,
      timerSeconds: targetSec,
      updatedAt: new Date().toISOString(),
    };
    userStateRef.current = nextState;
    saveStoredState(nextState);

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, [syncWithServer]);

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
            if (audioRef.current && audioRef.current.src !== targetJuz.localAudioUrl) {
              audioRef.current.src = targetJuz.localAudioUrl;
            }
          }
          if (audioRef.current && !isPlayingRef.current) {
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
              if (audioRef.current && audioRef.current.src !== targetJuz.localAudioUrl) {
                audioRef.current.src = targetJuz.localAudioUrl;
              }
            }
            if (audioRef.current) {
              audioRef.current.currentTime = reconciled.playbackPositionSeconds || 0;
            }
            setPlaybackPosition(reconciled.playbackPositionSeconds || 0);
            playbackPosRef.current = reconciled.playbackPositionSeconds || 0;
            setLastSynced(new Date().toLocaleTimeString());
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
  }, [userState.isLoggedIn, userState.userId, isSyncing]);

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
            const reconciled = reconcileStates(currentState, data.remoteState);
            setUserState(reconciled);
            userStateRef.current = reconciled;
            saveStoredState(reconciled);

            const targetPos = reconciled.playbackPositionSeconds || 0;
            const targetJuzId = reconciled.currentJuzId || 1;

            if (targetJuzId !== currentState.currentJuzId) {
              const targetJuz = INITIAL_JUZ_LIST.find((j) => j.id === targetJuzId) || INITIAL_JUZ_LIST[0];
              if (audioRef.current.src !== targetJuz.localAudioUrl) {
                audioRef.current.src = targetJuz.localAudioUrl;
              }
            }

            audioRef.current.currentTime = targetPos;
            setPlaybackPosition(targetPos);
            playbackPosRef.current = targetPos;
            setLastSynced(new Date().toLocaleTimeString());
          }
        }
      } catch (err) {
        console.warn("Pre-play sync offline/failed, continuing locally:", err);
      } finally {
        setIsSyncing(false);
      }
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      isPlayingRef.current = true;
      setSyncNotice(null);
      broadcastPlayback("PLAY");
    } catch (e) {
      console.warn("Playback error:", e);
    }
  }, [broadcastPlayback]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      // Immediately sync state to server on pause
      setTimeout(() => {
        syncWithServer();
      }, 50);
      isPlayingRef.current = false;
      broadcastPlayback("PAUSE");

      // Immediately sync pause state to server
      if (userStateRef.current.isLoggedIn) {
        fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: userStateRef.current,
            settings: settingsRef.current,
            deviceId: getDeviceId(),
            isPlaying: false,
            action: "pause",
          }),
        }).catch(() => {});
      }
    }
  }, [syncWithServer, broadcastPlayback]);

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
    const targetSec = settings.timerTargetMinutes * 60;
    timerSecondsRef.current = targetSec;
    updateStateAndPersist((prev) => ({
      ...prev,
      timerSeconds: targetSec,
    }));
  }, [settings.timerTargetMinutes, updateStateAndPersist]);

  const adjustTimerDefault = useCallback(
    (targetMinutes: number, resetCurrent: boolean = true) => {
      const validMinutes = Math.max(1, Math.min(720, Math.round(targetMinutes)));
      updateSettings({ timerTargetMinutes: validMinutes });
      if (resetCurrent) {
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
      // When reaching 0 and beyond, it continues into negative seconds (-1, -2, -3...),
      // which formatHeroTimer formats with '+' and counts upwards in overtime.
      const targetSec = settings.timerTargetMinutes * 60;
      const streakTargetSec =
        (settings.streakTargetMinutes || settings.timerTargetMinutes || 30) * 60;
      let nextTimerSec = timerSecondsRef.current;

      if (isNewDay) {
        nextTimerSec = targetSec;
      } else {
        nextTimerSec = nextTimerSec - 1;
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

        const targetCompleted = updatedSecondsRead >= streakTargetSec;

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
  }, [settings.timerMode, settings.timerTargetMinutes, settings.streakTargetMinutes, updateStateAndPersist]);

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
    // Requirement: When an audio file reaches the end it will update the Big Timer
    // to the default amount or the AutoTimer setting when it moves on to the next file.
    const autoMinutes =
      settings.autoTimerDurationMinutes ?? settings.timerTargetMinutes ?? 30;
    const resetTimerSec =
      settings.timerMode === "countdown" ? autoMinutes * 60 : 0;
    timerSecondsRef.current = resetTimerSec;

    // Requirement: Whenever an audio file reaches the end a Juz tally is updated.
    // This is what is used to update the 30 day percentage streak.
    const todayStr = getLocalDateString();
    const completedJuzId = currentJuz.id;

    updateStateAndPersist((s) => {
      const currentCompleted = s.completedJuzs || [];
      const nextCompleted = currentCompleted.includes(completedJuzId)
        ? currentCompleted
        : [...currentCompleted, completedJuzId].sort((a, b) => a - b);
      const nextTally = (s.juzTally || 0) + 1;

      const history = { ...s.historyRecords };
      const existingToday = history[todayStr] || {
        date: todayStr,
        secondsRead: 0,
        targetReached: false,
        slots: {},
        juzCompletedCount: 0,
        completedJuzIds: [],
      };

      const existingJuzIds = existingToday.completedJuzIds || [];
      const nextTodayCompletedJuzIds = [...existingJuzIds, completedJuzId];
      const nextTodayJuzCount = (existingToday.juzCompletedCount || 0) + 1;

      history[todayStr] = {
        ...existingToday,
        targetReached: true, // Completing a Juz fulfills the streak for the day
        juzCompletedCount: nextTodayJuzCount,
        completedJuzIds: nextTodayCompletedJuzIds,
      };

      return {
        ...s,
        timerSeconds: resetTimerSec,
        completedJuzs: nextCompleted,
        juzTally: nextTally,
        historyRecords: history,
        userLogs: [logEntry, ...(s.userLogs || [])].slice(0, 500),
      };
    });

    // Transition to next Juz seamlessly
    const nextJuzId = currentJuz.id < 30 ? currentJuz.id + 1 : 1;
    confirmJuzSwitch(nextJuzId);
  }, [
    currentJuz.id,
    juzName,
    playbackPosition,
    playbackSpeed,
    settings.autoTimerDurationMinutes,
    settings.timerTargetMinutes,
    updateStateAndPersist,
    confirmJuzSwitch,
  ]);

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

  const toggleDayStreakManually = useCallback(
    (dateStr: string) => {
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
        const nextCompleted = !existing.targetReached;
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
        streakTargetMinutes: settings.streakTargetMinutes ?? settings.timerTargetMinutes ?? 30,
        setStreakTargetMinutes,
        userLogs: userState.userLogs || [],
        completedJuzs: userState.completedJuzs || [],
        juzTally: userState.juzTally ?? (userState.completedJuzs ? userState.completedJuzs.length : 0),
        toggleJuzCompleted,
        setJuzTallyManually,
        setCompletedStreakDaysManually,
        toggleDayStreakManually,
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
          if (playbackSpeed) {
            e.currentTarget.playbackRate = playbackSpeed;
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

