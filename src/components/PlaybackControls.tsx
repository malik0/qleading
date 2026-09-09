"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import { PlaybackSpeed } from "../types/quran";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  RefreshCw,
} from "lucide-react";

const SPEEDS: PlaybackSpeed[] = [0.5, 1.0, 1.25, 1.5, 1.75, 2.0];

export const PlaybackControls: React.FC = () => {
  const {
    isPlaying,
    isSyncing,
    syncNotice,
    togglePlay,
    rewind,
    fastForward,
    resetTrack,
    playbackSpeed,
    setSpeed,
    settings,
  } = useApp();

  return (
    <div className="w-full bg-surface-card border border-surface-border rounded-3xl p-5 backdrop-blur-xl shadow-xl space-y-4 transition-colors duration-200">
      {/* Device sync notice banner */}
      {syncNotice && (
        <div className="text-center text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 py-2 px-4 rounded-2xl animate-fadeIn flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Main Playback Buttons */}
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {/* Reset Track Button (Requirement 2.1.2) */}
        <button
          onClick={resetTrack}
          title="Reset to start of Juz (00:00)"
          className="p-3 rounded-2xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition group flex flex-col items-center gap-1 shadow-sm"
        >
          <RotateCcw className="w-5 h-5 group-hover:-rotate-45 transition duration-200" />
          <span className="text-[10px] text-content-muted font-medium">Reset</span>
        </button>

        {/* Rewind Button (Requirement 2.1 & 2.1.1) */}
        <button
          onClick={rewind}
          title={`Rewind ${settings.rewindStepSeconds}s`}
          className="p-3 sm:p-3.5 rounded-2xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition flex flex-col items-center gap-1 shadow-sm active:scale-95"
        >
          <div className="flex items-center">
            <SkipBack className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono text-brand-primary font-bold">
            -{settings.rewindStepSeconds}s
          </span>
        </button>

        {/* Play / Pause Hero Button (Requirement 2.1 - with pre-play sync indicator) */}
        <button
          onClick={togglePlay}
          disabled={isSyncing}
          title={isSyncing ? "Syncing..." : isPlaying ? "Pause Audio" : "Play Audio"}
          style={{
            background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))",
            boxShadow: "0 12px 30px -5px var(--color-primary-glow)",
          }}
          className={`p-5 sm:p-6 rounded-3xl text-white transition duration-200 active:scale-95 hover:brightness-110 ${
            isSyncing ? "opacity-80 cursor-wait" : ""
          }`}
        >
          {isSyncing ? (
            <RefreshCw className="w-8 h-8 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Forward Button (Requirement 2.1 & 2.1.1) */}
        <button
          onClick={fastForward}
          title={`Forward ${settings.forwardStepSeconds}s`}
          className="p-3 sm:p-3.5 rounded-2xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition flex flex-col items-center gap-1 shadow-sm active:scale-95"
        >
          <div className="flex items-center">
            <SkipForward className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono text-brand-primary font-bold">
            +{settings.forwardStepSeconds}s
          </span>
        </button>
      </div>

      {/* Playback Speed Selector (Requirement 2.3) */}
      <div className="pt-3 border-t border-surface-border flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {SPEEDS.map((speed) => {
          const isSelected = playbackSpeed === speed;
          return (
            <button
              key={speed}
              onClick={() => setSpeed(speed)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold font-mono transition shadow-sm ${
                isSelected
                  ? "bg-brand-primary text-white shadow-md font-bold"
                  : "bg-surface-subtle hover:bg-surface-hover text-content-secondary border border-surface-border"
              }`}
            >
              {speed}x
            </button>
          );
        })}
      </div>
    </div>
  );
};
