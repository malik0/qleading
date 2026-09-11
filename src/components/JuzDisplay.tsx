"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { formatAudioTime, formatHeroTimer } from "../lib/utils";
import { ChevronDown, Volume2, SlidersHorizontal, Clock, X } from "lucide-react";
import { TimerModal } from "./TimerModal";
import { PlaybackControls } from "./PlaybackControls";

const formatDisplayRange = (range: string) => {
  if (!range) return "";
  return range
    .replace(/^Surah\s+/i, "")
    .replace(/\s+to\s+Surah\s+/gi, " → ")
    .replace(/\s+to\s+/gi, " → ");
};

export const JuzDisplay: React.FC = () => {
  const {
    juzList,
    currentJuz,
    currentJuzId,
    juzName,
    juzRange,
    isPlaying,
    playbackPosition,
    duration,
    playbackSpeed,
    seekTo,
    selectJuz,
    timerSeconds,
    isTimerRunning,
    todayRecord,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll dropdown to current Juz when opened (centered with 2 items above, current, 2 items below)
  // Only scrolls once upon opening, allowing the user to freely scroll up to previous Juzes
  useEffect(() => {
    if (isDropdownOpen && listContainerRef.current && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      const currentIdx = juzList.findIndex((item) => item.id === currentJuzId);
      if (currentIdx !== -1) {
        const itemStep = 56; // 52px item height + 4px gap
        const targetScrollTop = Math.max(0, (currentIdx - 2) * itemStep);
        listContainerRef.current.scrollTop = targetScrollTop;
        const raf = requestAnimationFrame(() => {
          if (listContainerRef.current) {
            listContainerRef.current.scrollTop = targetScrollTop;
          }
        });
        return () => cancelAnimationFrame(raf);
      }
    } else if (!isDropdownOpen) {
      hasScrolledRef.current = false;
    }
  }, [isDropdownOpen, currentJuzId, juzList]);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside (desktop & mobile)
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Time remaining adjusted for playback speed (Requirement 1.3)
  const rawRemainingSeconds = Math.max(0, duration - playbackPosition);
  const adjustedRemainingSeconds = rawRemainingSeconds / playbackSpeed;
  const adjustedElapsedSeconds = playbackPosition / playbackSpeed;

  // Remaining timer seconds until daily target
  const remainingTimerSeconds = Math.max(0, timerSeconds);

  const finishDate =
    currentDateTime && remainingTimerSeconds > 0
      ? new Date(currentDateTime.getTime() + remainingTimerSeconds * 1000)
      : null;

  const finishTimeStr = finishDate
    ? `${String(finishDate.getHours()).padStart(2, "0")}:${String(finishDate.getMinutes()).padStart(2, "0")}`
    : "";

  const formattedDateTime = currentDateTime
    ? `${currentDateTime.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })} • ${String(currentDateTime.getHours()).padStart(2, "0")}:${String(currentDateTime.getMinutes()).padStart(2, "0")}`
    : "";

  const progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, (playbackPosition / duration) * 100))
      : 0;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const newPos = (val / 100) * duration;
    seekTo(newPos);
  };

  // Requirement 1 & 8: Juz tally of the day displayed as small filled circle(s)
  // above the date but below the border of the Juz Display
  const todayJuzCount =
    todayRecord.juzCompletedCount ||
    (todayRecord.completedJuzIds ? todayRecord.completedJuzIds.length : 0);

  return (
    <div className="w-full bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl relative z-20 transition-colors duration-200">
      {/* Subtle Background Glows matching active theme (isolated in overflow-hidden layer) */}
      <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none -z-10">
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-300"
          style={{
            backgroundColor: "var(--color-primary)",
            opacity: 0.12,
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-300"
          style={{
            backgroundColor: "var(--color-primary-hover)",
            opacity: 0.1,
          }}
        />
      </div>

      {/* 1.4 MAIN READING TIMER (INTERACTIVE HERO TIMER) */}
      <div className="relative flex flex-col items-center justify-center pt-2 pb-4">
        {/* Clickable Area for Timer Modal */}
        <button
          onClick={() => setIsTimerModalOpen(true)}
          title="Click to manually edit timer or match audio"
          className="group flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-3xl px-3 sm:px-6 py-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer max-w-full"
        >
          {/* Requirement 1: The Juz tally of the day should appear as a small filled circle above the date but below the border of the Juz Display */}
          {todayJuzCount > 0 && (
            <div
              className="flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-full bg-surface-subtle border border-surface-border shadow-sm"
              title={`${todayJuzCount} Juz completed today`}
            >
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(todayJuzCount, 12) }).map((_, idx) => (
                  <span
                    key={idx}
                    className="w-2.5 h-2.5 rounded-full bg-brand-primary shadow-sm ring-1 ring-brand-light animate-fadeIn inline-block"
                  />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-brand-primary font-mono ml-0.5">
                {todayJuzCount} {todayJuzCount === 1 ? "Juz" : "Juzs"} today
              </span>
            </div>
          )}

          {/* Active status indicator & Today's Date and Time */}
          <div className="flex items-center gap-2 mb-1 max-w-full">
            <span
              className={`w-2 h-2 rounded-full transition-all shrink-0 ${
                isTimerRunning
                  ? "bg-brand-primary animate-ping"
                  : "bg-content-muted/40"
              }`}
            />
            <span className="text-xs font-semibold tracking-wide text-content-muted group-hover:text-brand-primary transition truncate">
              {formattedDateTime || "\u00A0"}
            </span>
          </div>

          {/* Huge Hero Timer Typography */}
          <div
            className="select-none tracking-tight font-extrabold text-content-primary text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-mono transition-all group-hover:brightness-110 whitespace-nowrap"
            style={{
              filter: "drop-shadow(0 10px 25px var(--color-primary-glow))",
            }}
          >
            {formatHeroTimer(timerSeconds)}
          </div>

          {/* Small text indicating when it will finish */}
          {currentDateTime && (
            <div className="text-xs sm:text-sm text-content-muted font-medium mt-1 mb-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-primary opacity-80 shrink-0" />
              <span className="truncate">
                {timerSeconds > 0
                  ? `Finishes at ${finishTimeStr}`
                  : "Target completed"}
              </span>
            </div>
          )}

          {/* Interactive Hint Pill */}
          <div className="mt-1.5 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] bg-surface-subtle group-hover:bg-surface-hover border border-surface-border text-content-muted group-hover:text-content-primary transition shadow-sm">
            <SlidersHorizontal className="w-3 h-3 text-brand-primary group-hover:rotate-90 transition-transform duration-300 shrink-0" />
            <span>Click to edit or match audio</span>
          </div>
        </button>

        {/* How Much Listened Today */}
        <div className="mt-3 flex flex-col items-center justify-center text-center select-none animate-fadeIn">
          <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-mono text-brand-primary leading-none">
            {Math.round((todayRecord.secondsRead || 0) / 60)}
          </span>
          <span className="text-xs sm:text-sm font-semibold text-content-secondary mt-1">
            Minutes listened today
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-surface-border to-transparent my-3 sm:my-4" />

      {/* 1.0 & 1.1 JUZ TITLE & SURAH RANGE */}
      <div className="flex flex-col items-center text-center space-y-1.5 relative px-2 z-30">
        {/* Juz Selector Dropdown */}
        <div ref={dropdownRef} className="relative inline-flex flex-col items-center max-w-full">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-primary font-bold text-base sm:text-lg shadow-md transition group max-w-full cursor-pointer"
          >
            <Volume2 className="w-5 h-5 text-brand-primary group-hover:scale-110 transition shrink-0" />
            <span className="truncate">{juzName}</span>
            <ChevronDown
              className={`w-4 h-4 text-content-muted transition-transform duration-200 shrink-0 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* 1.2 DROPDOWN MENU FOR ALL 30 JUZS (Scrollable, 5 items visible at a time) */}
          {isDropdownOpen && (
            <>
              {/* Backdrop to dismiss when clicking/tapping outside */}
              <div
                className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Dropdown Container: Centered horizontally directly under the button */}
              <div
                className="absolute top-full mt-2 z-50 w-[min(22rem,calc(100vw-2rem))] sm:w-84 bg-surface-card border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                  translate: "-50% 0",
                }}
              >
                {/* Dropdown Header */}
                <div className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-content-muted flex items-center justify-between border-b border-surface-border bg-surface-subtle/50">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Select Juz (1–30)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-1 rounded-lg hover:bg-surface-hover text-content-muted hover:text-content-primary transition cursor-pointer"
                    title="Close dropdown"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable list of all 30 Juzes - exactly 5 items visible at a time */}
                <div
                  ref={listContainerRef}
                  className="h-[288px] overflow-y-auto scrollbar-thin p-1.5 flex flex-col gap-1"
                >
                  {juzList.map((item) => {
                    const isCurrent = item.id === currentJuzId;
                    const displayName = item.customName || item.defaultName;
                    const displayRange = item.customRange || item.defaultRange;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          selectJuz(item.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full h-[52px] shrink-0 text-left px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-2.5 transition cursor-pointer ${
                          isCurrent
                            ? "bg-brand-primary text-white font-semibold shadow-md"
                            : "hover:bg-surface-subtle active:bg-surface-subtle/80 text-content-secondary hover:text-content-primary"
                        }`}
                      >
                        {/* Left: Juz Number Badge */}
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCurrent
                              ? "bg-white/20 text-white shadow-xs"
                              : "bg-surface-subtle text-content-muted border border-surface-border"
                          }`}
                        >
                          {item.id}
                        </span>

                        {/* Right: Juz Title & Range (Left aligned) */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className="font-bold text-xs sm:text-sm truncate">
                              {displayName}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] sm:text-[10px] bg-white/25 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                Playing
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[10.5px] sm:text-xs truncate w-full leading-tight tracking-tight text-left ${
                              isCurrent
                                ? "text-white/85 font-medium"
                                : "text-content-muted font-normal"
                            }`}
                            title={displayRange}
                          >
                            {formatDisplayRange(displayRange)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 1.1 Juz Range currently playing (Without 'Surah range:' prefix) */}
        <p className="text-xs sm:text-sm text-content-muted font-medium">
          <span className="text-content-primary font-semibold">{juzRange}</span>
        </p>
      </div>

      {/* 1.3 SYNCHRONIZED PROGRESS BAR */}
      <div className="mt-4 space-y-2">
        {/* Interactive Scrub Bar */}
        <div className="relative group">
          <input
            type="range"
            min="0"
            max="100"
            step="0.05"
            value={progressPercent}
            onChange={handleScrub}
            style={{
              accentColor: "var(--color-primary)",
              background: `linear-gradient(to right, var(--color-primary) ${progressPercent}%, var(--bg-card-subtle) ${progressPercent}%)`,
            }}
            className="w-full h-2.5 rounded-lg appearance-none cursor-pointer transition-all focus:outline-none border border-surface-border shadow-inner"
            aria-label="Audio progress scrub"
          />
        </div>

        {/* Left and Right Timestamps with Percentage Completed in Middle (Speed pill removed) */}
        <div className="flex items-center justify-between text-xs text-content-muted font-mono px-1">
          {/* Elapsed Time */}
          <div className="flex flex-col items-start">
            <span className="text-content-primary font-semibold">
              {formatAudioTime(playbackPosition)}
            </span>
            {playbackSpeed !== 1.0 && (
              <span className="text-[10px] text-content-muted">
                Live: {formatAudioTime(adjustedElapsedSeconds)}
              </span>
            )}
          </div>

          {/* Percentage Completed in Middle */}
          <span
            className="text-[11px] font-bold text-brand-primary font-mono bg-brand-light px-2.5 py-0.5 rounded-full border border-brand-primary/20 shadow-sm"
            title={`${progressPercent.toFixed(1)}% completed`}
          >
            {progressPercent.toFixed(1)}%
          </span>

          {/* Remaining Time (adjusted with playback speed) */}
          <div className="flex flex-col items-end">
            <span className="text-content-primary font-semibold">
              -{formatAudioTime(adjustedRemainingSeconds)}
            </span>
            <span className="text-[10px] text-content-muted">
              {playbackSpeed !== 1.0 ? "Adjusted" : "left"}
            </span>
          </div>
        </div>
      </div>

      {/* 2.0 - 2.3 PLAYBACK CONTROLS */}
      <PlaybackControls />

      {/* Timer Adjust & Reset Modal */}
      <TimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
      />
    </div>
  );
};
