"use client";

import React, { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { formatAudioTime } from "../lib/utils";
import { Play, Volume2, Check } from "lucide-react";

export const JuzListTable: React.FC = () => {
  const {
    juzList,
    currentJuzId,
    isPlaying,
    selectJuz,
    completedJuzs,
    toggleJuzCompleted,
  } = useApp();

  const currentItemRef = useRef<HTMLDivElement | null>(null);

  // Requirement: In The 30 Juz Playlist, the current playlist should always be visible in the window.
  useEffect(() => {
    if (currentItemRef.current) {
      currentItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentJuzId]);

  const completedCount = completedJuzs.filter((id) => id >= 1 && id <= 30).length;
  const progressPercentage = Math.round((completedCount / 30) * 100);

  return (
    <section className="w-full bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl p-4 sm:p-7 backdrop-blur-xl shadow-xl space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-content-primary">Juz Checklist</h2>
          <p className="text-xs text-content-muted">
            Tap any Juz to mark completed • Tap Play to listen
          </p>
        </div>

        {/* Percentage indicator and progress bar */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-xs font-mono font-bold text-brand-primary bg-brand-light px-2.5 py-0.5 rounded-full border border-brand-primary/20">
            {completedCount}/30 ({progressPercentage}%)
          </span>
          <div className="w-24 sm:w-32 h-2 bg-surface-subtle border border-surface-border rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-primary transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* List of 30 Juzs (Checklist) */}
      <div className="divide-y divide-surface-border max-h-[500px] overflow-y-auto pr-1">
        {juzList.map((item) => {
          const isCurrent = item.id === currentJuzId;
          const isDone = completedJuzs.includes(item.id);
          const name = item.customName || item.defaultName;
          const range = item.customRange || item.defaultRange;

          let rowStyle = "hover:bg-surface-subtle text-content-secondary";
          if (isCurrent && isDone) {
            rowStyle = "bg-brand-light/90 dark:bg-brand-primary/25 border-2 border-brand-primary text-content-primary shadow-sm";
          } else if (isCurrent) {
            rowStyle = "bg-brand-light/60 border border-brand-primary/40 text-content-primary";
          } else if (isDone) {
            rowStyle = "bg-brand-light/70 dark:bg-brand-primary/15 border border-brand-primary/30 text-content-primary";
          }

          return (
            <div
              key={item.id}
              ref={isCurrent ? currentItemRef : undefined}
              className={`py-3 px-3 sm:px-4 rounded-2xl flex items-center justify-between gap-3 transition ${rowStyle}`}
            >
              {/* Left: Juz Number Checkbox & Surah Range */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Tap to mark done or undone */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleJuzCompleted(item.id);
                  }}
                  title={isDone ? `Mark Juz ${item.id} undone` : `Mark Juz ${item.id} completed`}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition shadow-sm cursor-pointer ${
                    isDone
                      ? "bg-brand-primary text-white shadow-md ring-2 ring-brand-primary/30 active:scale-95"
                      : isCurrent
                      ? "bg-brand-primary/80 text-white hover:bg-brand-primary"
                      : "bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary border border-surface-border"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span>{item.id}</span>
                  )}
                </button>

                <div
                  className="min-w-0 flex-1 cursor-pointer select-none"
                  onClick={() => toggleJuzCompleted(item.id)}
                  title={isDone ? "Tap to mark undone" : "Tap to mark done"}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm sm:text-base truncate ${
                        isDone
                          ? "text-content-primary line-through opacity-85"
                          : "text-content-primary"
                      }`}
                    >
                      {name}
                    </span>

                    {isDone && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary bg-brand-light px-2 py-0.5 rounded-full border border-brand-primary/20">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Done
                      </span>
                    )}

                    {isCurrent && isPlaying && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary bg-brand-light px-2 py-0.5 rounded-full border border-brand-primary/30 animate-pulse">
                        <Volume2 className="w-3 h-3" />
                        Playing
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-content-muted truncate mt-0.5 font-medium">
                    {range}
                  </p>
                </div>
              </div>

              {/* Right: Approx Duration & Play Button */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-content-muted hidden sm:inline">
                  {formatAudioTime(item.approxDurationSeconds)}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectJuz(item.id);
                  }}
                  title={isCurrent ? "Currently Loaded" : `Play ${name}`}
                  className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
                    isCurrent
                      ? "bg-brand-primary text-white shadow-md font-bold"
                      : "bg-surface-subtle hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border"
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">
                    {isCurrent ? "Active" : "Play"}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
