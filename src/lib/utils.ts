import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Requirement 1.4 & Overtime:
 * Shows hours, minutes & seconds: but if it’s less than an hour it hides the hour part.
 * If the timer completes and counts upwards (totalSeconds < 0), prepends '+' to the formatted time.
 */
export function formatHeroTimer(totalSeconds: number): string {
  const isOvertime = totalSeconds < 0;
  const sec = Math.abs(Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  const formatted =
    hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;

  return isOvertime ? `+${formatted}` : formatted;
}

/**
 * Format audio timestamps (e.g. 03:45 or 1:12:30)
 */
export function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const sec = Math.floor(seconds);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Get current date formatted as YYYY-MM-DD in local time
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get current 15-minute slot index of the day (0 to 95)
 */
export function getSlotIndexForDate(d: Date = new Date()): number {
  const hours = d.getHours();
  const minutes = d.getMinutes();
  return hours * 4 + Math.floor(minutes / 15);
}

/**
 * Format slot index (0..95) to time string e.g. "14:15"
 */
export function formatSlotTime(slotIndex: number): string {
  const hour = Math.floor(slotIndex / 4);
  const min = (slotIndex % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Format ISO string to relative human-readable string (e.g. "Just now", "2m ago", "1h ago")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

/**
 * Format ISO string to local time string (e.g. "14:32:05")
 */
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return isoString;
  }
}
