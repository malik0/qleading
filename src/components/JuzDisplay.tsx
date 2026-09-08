"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { formatAudioTime, formatHeroTimer } from "../lib/utils";
import { ChevronDown, Volume2, Download, SlidersHorizontal } from "lucide-react";
import { TimerModal } from "./TimerModal";

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
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);

  // Time remaining adjusted for playback speed (Requirement 1.3)
  const rawRemainingSeconds = Math.max(0, duration - playbackPosition);
  const adjustedRemainingSeconds = rawRemainingSeconds / playbackSpeed;
  const adjustedElapsedSeconds = playbackPosition / playbackSpeed;

  const progressPercent =
    duration > 0
      ? Math.min(100, Math.max(0, (playbackPosition / duration) * 100))
      : 0;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const newPos = (val / 100) * duration;
    seekTo(newPos);
  };

  return (
    <div className="w-full bg-surface-card border border-surface-border rounded-3xl p-4 sm:p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors duration-200">
      {/* Subtle Background Glows matching active theme */}
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

      {/* 1.4 MAIN READING TIMER (INTERACTIVE HERO TIMER) */}
      <div className="flex flex-col items-center justify-center text-center my-2 sm:my-3 relative">
        <button
          type="button"
          onClick={() => setIsTimerModalOpen(true)}
          title="Click to adjust timer default value or reset timer"
          className="group flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-3xl px-6 py-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          {/* Active status indicator */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                isTimerRunning
                  ? "bg-brand-primary animate-ping"
                  : "bg-content-muted/40"
              }`}
            />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-content-muted group-hover:text-brand-primary transition">
              {isTimerRunning ? "Reading Active" : "Reading Timer"}
            </span>
          </div>

          {/* Huge Hero Timer Typography */}
          <div
            className="select-none tracking-tight font-extrabold text-content-primary text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-mono transition-all group-hover:brightness-110"
            style={{
              filter: "drop-shadow(0 10px 25px var(--color-primary-glow))",
            }}
          >
            {formatHeroTimer(timerSeconds)}
          </div>

          {/* Interactive Hint Pill */}
          <div className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] bg-surface-subtle group-hover:bg-surface-hover border border-surface-border text-content-muted group-hover:text-content-primary transition shadow-sm">
            <SlidersHorizontal className="w-3 h-3 text-brand-primary group-hover:rotate-90 transition-transform duration-300" />
            <span>Click to adjust or reset</span>
          </div>
        </button>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-surface-border to-transparent my-3 sm:my-4" />

      {/* 1.0 & 1.1 JUZ TITLE & SURAH RANGE */}
      <div className="flex flex-col items-center text-center space-y-1.5 relative">
        {/* Juz Selector Dropdown & Download Button */}
        <div className="flex items-center gap-2 relative">
          <div className="relative inline-block">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-primary font-bold text-base sm:text-lg shadow-md transition group"
            >
              <Volume2 className="w-5 h-5 text-brand-primary group-hover:scale-110 transition" />
              <span>{juzName}</span>
              <ChevronDown
                className={`w-4 h-4 text-content-muted transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* 1.2 DROPDOWN MENU FOR ALL 30 JUZS */}
            {isDropdownOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 sm:w-96 max-h-80 overflow-y-auto bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-2 z-50 divide-y divide-surface-border">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-content-muted">
                  Select from 30 Quran Juz
                </div>
                <div className="py-1">
                  {juzList.map((item) => {
                    const isCurrent = item.id === currentJuzId;
                    const displayName = item.customName || item.defaultName;
                    const displayRange = item.customRange || item.defaultRange;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setIsDropdownOpen(false);
                          selectJuz(item.id);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex flex-col transition ${
                          isCurrent
                            ? "bg-brand-light text-brand-primary border border-brand-primary/30"
                            : "hover:bg-surface-subtle text-content-secondary hover:text-content-primary"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{displayName}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-brand-primary text-white font-bold px-1.5 py-0.5 rounded">
                              Playing
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-content-muted line-clamp-1 mt-0.5">
                          {displayRange}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Direct Download Button */}
          <a
            href={currentJuz.localAudioUrl}
            download={`${juzName.replace(/\s+/g, "_")}_MaherAlMuaiqly.webm`}
            title={`Download ${juzName} Audio (${currentJuz.defaultName})`}
            className="p-2 sm:p-2.5 rounded-2xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition flex items-center justify-center shadow-md group"
          >
            <Download className="w-5 h-5 text-brand-primary group-hover:scale-110 transition" />
          </a>
        </div>

        {/* 1.1 Juz Range currently playing */}
        <p className="text-xs sm:text-sm text-content-secondary max-w-xl font-medium px-4">
          {juzRange}
        </p>
      </div>

      {/* 1.3 SYNCHRONIZED PROGRESS BAR WITH SPEED ADJUSTMENTS */}
      <div className="mt-4 space-y-1.5">
        {/* Interactive Scrub Bar */}
        <div className="relative group">
          <input
            type="range"
            min="0"
            max="100"
            step="0.05"
            value={progressPercent}
            onChange={handleScrub}
            style={{ accentColor: "var(--color-primary)" }}
            className="w-full h-2.5 bg-surface-subtle rounded-lg appearance-none cursor-pointer transition-all focus:outline-none"
            aria-label="Audio progress scrub"
          />
        </div>

        {/* Left and Right Timestamps */}
        <div className="flex items-center justify-between text-xs text-content-muted font-mono px-1">
          {/* Elapsed Time */}
          <div className="flex flex-col items-start">
            <span className="text-content-primary font-semibold">
              {formatAudioTime(playbackPosition)}
            </span>
            {playbackSpeed !== 1.0 && (
              <span className="text-[10px] text-content-muted">
                adj: {formatAudioTime(adjustedElapsedSeconds)}
              </span>
            )}
          </div>

          {/* Speed Indicator in Middle */}
          <div className="text-[11px] text-brand-primary font-sans font-medium bg-brand-light px-2.5 py-0.5 rounded-full border border-brand-primary/20">
            {playbackSpeed}x Speed
          </div>

          {/* Remaining Time (adjusted with playback speed) */}
          <div className="flex flex-col items-end">
            <span className="text-content-primary font-semibold">
              -{formatAudioTime(adjustedRemainingSeconds)}
            </span>
            <span className="text-[10px] text-content-muted">
              {playbackSpeed !== 1.0 ? "adjusted left" : "left"}
            </span>
          </div>
        </div>
      </div>

      {/* Timer Adjust & Reset Modal */}
      <TimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
      />
    </div>
  );
};
