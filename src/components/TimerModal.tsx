"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../context/AppContext";
import { formatHeroTimer, formatAudioTime } from "../lib/utils";
import {
  X,
  Clock,
  RotateCcw,
  Sliders,
  Check,
  CheckCircle2,
  Plus,
  Minus,
  Headphones,
  Pencil,
} from "lucide-react";

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_MINUTES = [15, 30, 45, 60, 90, 120];

export const TimerModal: React.FC<TimerModalProps> = ({ isOpen, onClose }) => {
  const {
    timerSeconds,
    timerTargetMinutes,
    isTimerRunning,
    resetTimer,
    setTimerSeconds,
    adjustTimerDefault,
    duration,
    playbackPosition,
    playbackSpeed,
    juzName,
    matchAudio,
  } = useApp();

  const [manualMinutes, setManualMinutes] = useState<number>(() =>
    Math.floor(Math.max(0, timerSeconds) / 60)
  );
  const [manualSeconds, setManualSeconds] = useState<number>(
    () => Math.max(0, timerSeconds) % 60
  );
  const [targetMinutes, setTargetMinutes] = useState(timerTargetMinutes);
  const [applyToCurrent, setApplyToCurrent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state when modal opens (do not re-run every second while timer ticks)
  useEffect(() => {
    if (isOpen) {
      const sec = Math.max(0, timerSeconds);
      setManualMinutes(Math.floor(sec / 60));
      setManualSeconds(sec % 60);
      setTargetMinutes(timerTargetMinutes);
      setApplyToCurrent(false);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Calculate remaining time in current audio adjusted for active playback speed
  const speed = playbackSpeed || 1.0;
  const rawTimeLeftInAudio = Math.max(
    0,
    Math.round((duration || 0) - (playbackPosition || 0))
  );
  const timeLeftInAudio = Math.round(rawTimeLeftInAudio / speed);
  const audioTimeFormatted = formatAudioTime(timeLeftInAudio);

  // Match Audio Handler: Sets the timer to adjusted time left in audio
  const handleMatchAudio = () => {
    const { timeLeft, speed: activeSpeed } = matchAudio();
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    setManualMinutes(mins);
    setManualSeconds(secs);
    setApplyToCurrent(false);
    setTimerSeconds(timeLeft);
    setSuccessMessage(
      `Matched audio: ${formatHeroTimer(timeLeft)} left in ${juzName}${activeSpeed !== 1.0 ? ` (${activeSpeed}x speed)` : ""}`
    );
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Apply Manual Edit to active timer
  const handleApplyManualTime = () => {
    const totalSec = manualMinutes * 60 + manualSeconds;
    setApplyToCurrent(false);
    setTimerSeconds(totalSec);
    setSuccessMessage(`Big Timer set to ${formatHeroTimer(totalSec)}`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2500);
  };

  // Reset Timer to default target
  const handleResetTimer = () => {
    resetTimer();
    setManualMinutes(timerTargetMinutes);
    setManualSeconds(0);
    setApplyToCurrent(false);
    setSuccessMessage(`Timer reset to default (${timerTargetMinutes}:00)`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2500);
  };

  // Nudge time up or down
  const handleNudge = (deltaSeconds: number) => {
    const currentTotal = manualMinutes * 60 + manualSeconds;
    const nextTotal = Math.max(0, currentTotal + deltaSeconds);
    const m = Math.floor(nextTotal / 60);
    const s = nextTotal % 60;
    setManualMinutes(m);
    setManualSeconds(s);
    setApplyToCurrent(false);
    setTimerSeconds(nextTotal);
    setSuccessMessage(`Big Timer adjusted to ${formatHeroTimer(nextTotal)}`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 2000);
  };

  const handleQuickPreset = (mins: number) => {
    setTargetMinutes(mins);
  };

  const handleAdjustStep = (delta: number) => {
    setTargetMinutes((prev) => Math.max(1, Math.min(720, prev + delta)));
  };

  const handleSaveAndApply = () => {
    if (applyToCurrent) {
      adjustTimerDefault(targetMinutes, true);
    } else {
      const totalSec = manualMinutes * 60 + manualSeconds;
      setTimerSeconds(totalSec);
      adjustTimerDefault(targetMinutes, false);
    }
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-brand-light text-brand-primary shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-content-primary">
                Edit Big Timer
              </h3>
              <p className="text-xs text-content-muted">
                Manually edit reading timer, match audio, or adjust default
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="p-1.5 sm:p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[80vh] overflow-y-auto">
          {/* SECTION 1: MANUALLY EDITABLE BIG TIMER */}
          <div className="bg-surface-subtle border border-surface-border rounded-2xl p-4 sm:p-5 relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between text-xs text-content-muted">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-content-primary">
                <Pencil className="w-3.5 h-3.5 text-brand-primary" />
                Edit Current Timer
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isTimerRunning
                    ? "bg-brand-light text-brand-primary border-brand-primary/30 animate-pulse"
                    : "bg-surface-card text-content-muted border-surface-border"
                }`}
              >
                {isTimerRunning ? "Active (Playing)" : "Paused"}
              </span>
            </div>

            {/* Manual Numeric Inputs (Minutes : Seconds) */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min={0}
                  max={720}
                  value={manualMinutes}
                  onChange={(e) => {
                    const val = Math.max(
                      0,
                      Math.min(720, parseInt(e.target.value, 10) || 0)
                    );
                    setManualMinutes(val);
                  }}
                  className="w-20 sm:w-24 bg-surface-card border-2 border-surface-border focus:border-brand-primary rounded-2xl p-2 text-center text-3xl sm:text-4xl font-mono font-extrabold text-content-primary focus:outline-none transition shadow-inner"
                />
                <span className="text-[10px] sm:text-[11px] font-semibold text-content-muted mt-1 uppercase tracking-wider">
                  Minutes
                </span>
              </div>

              <span className="text-3xl sm:text-4xl font-mono font-bold text-content-muted/60 pb-5">
                :
              </span>

              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={String(manualSeconds).padStart(2, "0")}
                  onChange={(e) => {
                    const val = Math.max(
                      0,
                      Math.min(59, parseInt(e.target.value, 10) || 0)
                    );
                    setManualSeconds(val);
                  }}
                  className="w-20 sm:w-24 bg-surface-card border-2 border-surface-border focus:border-brand-primary rounded-2xl p-2 text-center text-3xl sm:text-4xl font-mono font-extrabold text-content-primary focus:outline-none transition shadow-inner"
                />
                <span className="text-[10px] sm:text-[11px] font-semibold text-content-muted mt-1 uppercase tracking-wider">
                  Seconds
                </span>
              </div>
            </div>

            {/* Quick Step Adjustment Buttons */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-0.5">
              {[-300, -60, 60, 300].map((delta) => {
                const label =
                  delta === -300
                    ? "-5m"
                    : delta === -60
                    ? "-1m"
                    : delta === 60
                    ? "+1m"
                    : "+5m";
                return (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleNudge(delta)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-surface-card hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer active:scale-95"
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* MATCH AUDIO BUTTON (Key Requirement) */}
            <button
              type="button"
              onClick={handleMatchAudio}
              title={`Match remaining audio time (${audioTimeFormatted} remaining in ${juzName}${speed !== 1.0 ? ` at ${speed}x speed` : ""})`}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-brand-light/50 hover:bg-brand-light border border-brand-primary/30 hover:border-brand-primary/60 text-brand-primary transition shadow-sm group active:scale-[0.99] cursor-pointer mt-1"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-primary text-white shadow-sm shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-bold text-xs sm:text-sm text-content-primary group-hover:text-brand-primary transition block">
                    Match Audio
                  </span>
                  <span className="text-[11px] text-content-muted block">
                    Match time left in audio ({audioTimeFormatted} remaining in {juzName}
                    {speed !== 1.0 ? ` at ${speed}x speed` : ""})
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-surface-card px-2.5 py-1 rounded-lg border border-brand-primary/30 text-brand-primary shadow-xs shrink-0">
                {audioTimeFormatted}
              </span>
            </button>

            {(() => {
              const totalSec = manualMinutes * 60 + manualSeconds;
              const h = Math.floor(totalSec / 3600);
              const m = Math.floor((totalSec % 3600) / 60);
              const s = totalSec % 60;
              const formattedTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

              return (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApplyManualTime}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border hover:border-brand-primary/40 text-content-primary font-semibold text-xs transition shadow-sm cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Set to {formattedTime}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    title="Reset timer to default target"
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-content-muted hover:text-content-primary font-medium text-xs transition shadow-sm cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Reset ({timerTargetMinutes}m)</span>
                  </button>
                </div>
              );
            })()}

            {/* Notification / Feedback Banner */}
            {successMessage && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-brand-primary font-semibold animate-fadeIn bg-brand-light/30 border border-brand-primary/20 py-1.5 px-3 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
          </div>

          {/* SECTION 2: DEFAULT TIMER DURATION SETTING */}
          <div className="space-y-4 pt-1 border-t border-surface-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-primary" />
                <h4 className="text-xs sm:text-sm font-bold text-content-primary">
                  Default Timer Duration
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-brand-primary bg-brand-light px-2.5 py-0.5 rounded-lg border border-brand-primary/20">
                {targetMinutes} minutes
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label className="text-xs text-content-muted block mb-2 font-medium">
                Quick Presets:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_MINUTES.map((mins) => {
                  const isSelected = targetMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleQuickPreset(mins)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold font-mono transition border cursor-pointer ${
                        isSelected
                          ? "bg-brand-primary text-white border-brand-primary shadow-md font-bold"
                          : "bg-surface-subtle hover:bg-surface-hover text-content-secondary border-surface-border"
                      }`}
                    >
                      {mins}m
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Minutes Stepper */}
            <div>
              <label className="text-xs text-content-muted block mb-2 font-medium">
                Custom Duration (1 - 720 minutes):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAdjustStep(-5)}
                  title="Decrease by 5 minutes"
                  className="p-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={targetMinutes}
                  onChange={(e) =>
                    setTargetMinutes(
                      Math.max(
                        1,
                        Math.min(720, parseInt(e.target.value, 10) || 1)
                      )
                    )
                  }
                  className="flex-1 bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-center text-base font-mono font-bold text-content-primary focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustStep(5)}
                  title="Increase by 5 minutes"
                  className="p-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Checkbox: Reset active timer to new default duration */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-subtle border border-surface-border cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyToCurrent}
                onChange={(e) => setApplyToCurrent(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary accent-brand-primary focus:ring-0 cursor-pointer"
              />
              <div className="text-xs text-content-secondary">
                <span className="font-semibold text-content-primary block">
                  Reset active timer to this default value
                </span>
                <span>
                  Applies the default duration ({targetMinutes}m) to the active timer now
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 p-3 sm:p-4 border-t border-surface-border bg-surface-subtle/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-content-secondary hover:text-content-primary hover:bg-surface-hover transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
