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
  loginUser: (email: string, name?: string) => Promise<void>;
  logoutUser: () => void;
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
  const lastActiveDateRef = useRef(getLocalDateString());
  const timerSecondsRef = useRef(userState.timerSeconds);
  const playbackPosRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    timerSecondsRef.current = userState.timerSeconds;
  }, [userState.timerSeconds]);

  useEffect(() => {
    playbackPosRef.current = playbackPosition;
  }, [playbackPosition]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Load from local storage on mount
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
    setPlaybackPosition(loadedState.playbackPositionSeconds || 0);
    playbackPosRef.current = loadedState.playbackPositionSeconds || 0;
    timerSecondsRef.current = loadedState.timerSeconds || loadedSettings.timerTargetMinutes * 60;
    lastActiveDateRef.current = loadedState.lastActiveDate || getLocalDateString();
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
        saveStoredState(timestamped);
        return timestamped;
      });
    },
    []
  );

  // Sync with Cloudflare API endpoint
  const manualSync = useCallback(async () => {
    if (!userState.isLoggedIn) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: userState, settings }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.remoteState) {
          const reconciled = reconcileStates(userState, data.remoteState);
          setUserState(reconciled);
          saveStoredState(reconciled);
          if (reconciled.currentJuzId !== userState.currentJuzId) {
            setPlaybackPosition(reconciled.playbackPositionSeconds);
          }
        }
        setLastSynced(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn("Background sync offline/failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [userState, settings]);

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
    }
  }, []);

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
      }, 100);
    },
    [updateStateAndPersist, play]
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
  const loginUser = useCallback(async (email: string, name?: string) => {
    const newState: UserState = {
      ...userState,
      userId: "usr_" + btoa(email).substring(0, 12),
      userEmail: email,
      userName: name || email.split("@")[0],
      isLoggedIn: true,
      updatedAt: new Date().toISOString(),
    };
    setUserState(newState);
    saveStoredState(newState);
    // Trigger remote sync
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState, settings }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.remoteState) {
          const merged = reconcileStates(newState, data.remoteState);
          setUserState(merged);
          saveStoredState(merged);
        }
      }
    } catch {}
  }, [userState, settings]);

  const logoutUser = useCallback(() => {
    const loggedOutState: UserState = {
      ...userState,
      isLoggedIn: false,
      userEmail: "",
      userName: "Guest User",
      updatedAt: new Date().toISOString(),
    };
    setUserState(loggedOutState);
    saveStoredState(loggedOutState);
  }, [userState]);

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

