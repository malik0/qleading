export interface JuzInfo {
  id: number;
  defaultName: string;
  customName?: string;
  defaultRange: string;
  customRange?: string;
  localAudioUrl: string;
  cdnAudioUrl: string;
  approxDurationSeconds: number;
}

export type PlaybackSpeed = 0.5 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0;
export type TimerMode = 'countdown' | 'countup';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
export type ThemeMode = 'dark' | 'light' | 'system';
export type ThemeColor =
  | 'sky'
  | 'emerald'
  | 'amber'
  | 'sepia'
  | 'indigo'
  | 'teal'
  | 'rose'
  | 'purple'
  | 'olive'
  | 'oled'
  | 'coral'
  | 'slate';

export interface AppSettings {
  rewindStepSeconds: number;
  forwardStepSeconds: number;
  timerTargetMinutes: number;
  streakTargetMinutes?: number;
  autoTimerDurationMinutes?: number;
  timerMode: TimerMode;
  streakStartDay: DayOfWeek;
  preferLocalAudio: boolean;
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  defaultPlaybackSpeed?: PlaybackSpeed;
  customJuzNames: Record<number, string>;
  customJuzRanges: Record<number, string>;
  khatmPlan?: KhatmPlan | null;
  enableBackToTop?: boolean;
}

export interface KhatmPlan {
  id: string;
  title?: string;
  startDate: string; // YYYY-MM-DD
  startJuz: number; // 1 to 30
  durationDays: number; // e.g. 30
  amountPerDay: number; // e.g. 1 (Juzes per day)
  completedDays: number[]; // 0-indexed day offsets: 0 .. (durationDays - 1)
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DayReadingRecord {
  date: string; // YYYY-MM-DD
  secondsRead: number;
  targetReached: boolean;
  // 96 slots in 24 hours (15 min each: index 0 to 95)
  // Each slot stores seconds read during that 15-min interval
  slots: Record<number, number>;
  juzCompletedCount?: number;
  completedJuzIds?: number[];
}

export interface UserLogEntry {
  id: string;
  timestamp: string; // ISO string
  juzId: number;
  juzName: string;
  durationSeconds: number;
  playbackSpeed: number;
  action: 'listen' | 'complete_juz' | 'target_reached';
}

export interface SyncPoint {
  id: string;
  timestamp: string; // ISO string
  juzId: number;
  juzName: string;
  playbackPositionSeconds: number; // audiofile position in seconds
  audioDurationSeconds?: number;
  timerSeconds: number; // Big Timer value in seconds
  timerTargetMinutes?: number;
  label?: string; // e.g. "Manual Sync", "Auto Sync", "Pre-Play Sync", "Checkpoint", "Pause"
}

export interface AccidentRecord {
  timestamp: number; // Date.now()
  actionType: "reset_track" | "switch_juz" | "seek_jump" | "timer_reset" | "manual";
  description: string;
  beforeState: {
    juzId: number;
    juzName: string;
    playbackPositionSeconds: number;
    timerSeconds: number;
  };
  fifteenSecBeforeState: {
    juzId: number;
    juzName: string;
    playbackPositionSeconds: number;
    timerSeconds: number;
  };
}

export interface UserState {
  userId: string;
  userName: string;
  userEmail: string;
  isLoggedIn: boolean;
  currentJuzId: number;
  playbackPositionSeconds: number; // saved each second
  timerSeconds: number; // saved each second
  timerTargetMinutes: number;
  streakTargetMinutes?: number;
  lastActiveDate: string; // YYYY-MM-DD
  updatedAt: string; // ISO string for conflict resolution
  historyRecords: Record<string, DayReadingRecord>; // keyed by YYYY-MM-DD
  userLogs: UserLogEntry[];
  activeDeviceId?: string; // Client device currently controlling playback
  isPlaying?: boolean; // Whether audio is actively playing on this account
  completedJuzs?: number[]; // List of completed Juz IDs (1-30)
  juzTally?: number; // Total completed Juz count
  khatmPlan?: KhatmPlan | null;
  syncPoints?: SyncPoint[];
}

export interface SyncPayload {
  state: UserState;
  settings?: AppSettings;
  deviceId?: string;
  isPlaying?: boolean;
  isStartingPlayback?: boolean;
  action?: "claim_playback" | "sync" | "pause" | "heartbeat";
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  state?: UserState;
  settings?: AppSettings;
  token?: string;
  message?: string;
  error?: string;
  randomCredentials?: {
    username: string;
    email: string;
    password?: string;
  };
}

export interface AccountResetPayload {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  randomizeIdentity?: boolean;
  resetReadingData?: boolean;
}

