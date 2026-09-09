"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../context/AppContext";
import { formatHeroTimer } from "../lib/utils";
import {
  X,
  Clock,
  RotateCcw,
  Sliders,
  Check,
  CheckCircle2,
  Plus,
  Minus,
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
    adjustTimerDefault,
  } = useApp();

  const [targetMinutes, setTargetMinutes] = useState(timerTargetMinutes);
  const [applyToCurrent, setApplyToCurrent] = useState(true);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(
    null
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetMinutes(timerTargetMinutes);
      setResetSuccessMessage(null);
    }
  }, [isOpen, timerTargetMinutes]);

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

  const handleResetTimer = () => {
    resetTimer();
    setResetSuccessMessage(`Timer reset to ${timerTargetMinutes}:00`);
    setTimeout(() => {
      setResetSuccessMessage(null);
    }, 2500);
  };

  const handleQuickPreset = (mins: number) => {
    setTargetMinutes(mins);
  };

  const handleAdjustStep = (delta: number) => {
    setTargetMinutes((prev) => Math.max(1, Math.min(720, prev + delta)));
  };

  const handleSaveAndApply = () => {
    adjustTimerDefault(targetMinutes, applyToCurrent);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-card border border-surface-border rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-light text-brand-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-content-primary">
                Main Reading Timer
              </h3>
              <p className="text-xs text-content-muted">
                Adjust reading timer duration or reset current timer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Live Timer Status Card with Quick Reset */}
          <div className="bg-surface-subtle border border-surface-border rounded-2xl p-4 sm:p-5 text-center relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-content-muted mb-2">
              <span className="font-semibold uppercase tracking-wider">
                Current Timer
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

            {/* Current Value Display */}
            <div className="font-mono text-4xl sm:text-5xl font-extrabold text-content-primary my-1 tracking-tight">
              {formatHeroTimer(timerSeconds)}
            </div>

            <p className="text-xs text-content-muted mb-4">
              Target: <strong className="text-content-primary">{timerTargetMinutes} minutes</strong>
            </p>

            {/* Reset Button */}
            <button
              onClick={handleResetTimer}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-content-primary hover:border-brand-primary/50 font-semibold text-sm transition shadow-sm group active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4 text-brand-primary group-hover:-rotate-45 transition duration-200" />
              <span>Reset Timer to Default</span>
            </button>

            {resetSuccessMessage && (
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-brand-primary font-medium animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}
          </div>

          {/* Adjust Timer Default Duration Section */}
          <div className="space-y-4 pt-1 border-t border-surface-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-primary" />
                <h4 className="text-sm font-bold text-content-primary">
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
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold font-mono transition border ${
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
                  className="p-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition"
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
                      Math.max(1, Math.min(720, parseInt(e.target.value, 10) || 1))
                    )
                  }
                  className="flex-1 bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-center text-base font-mono font-bold text-content-primary focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustStep(5)}
                  title="Increase by 5 minutes"
                  className="p-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Checkbox: Apply to active timer now */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-subtle border border-surface-border cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyToCurrent}
                onChange={(e) => setApplyToCurrent(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary accent-brand-primary focus:ring-0 cursor-pointer"
              />
              <div className="text-xs text-content-secondary">
                <span className="font-semibold text-content-primary block">
                  Update active timer immediately
                </span>
                <span>
                  Resets the current timer to reflect the new default value
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 border-t border-surface-border bg-surface-subtle/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-content-secondary hover:text-content-primary hover:bg-surface-hover transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold shadow-md transition active:scale-95"
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
