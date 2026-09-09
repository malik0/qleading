"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { KhatmPlan } from "../types/quran";
import { getLocalDateString } from "../lib/utils";
import {
  Calendar,
  Flag,
  Play,
  Pause,
  Check,
  CheckCircle2,
  Sparkles,
  Trophy,
  RotateCcw,
  Trash2,
  Pencil,
  Plus,
  Flame,
} from "lucide-react";

/**
 * Helper to add days to a YYYY-MM-DD string without timezone shifts
 */
function addDaysToDateStr(dateStr: string, daysToAdd: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + daysToAdd);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date string into human-readable e.g. "Wed, Sep 9"
 */
function formatHumanDate(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface DayScheduleItem {
  dayIndex: number; // 0 to durationDays - 1
  dayNumber: number; // 1 to durationDays
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  isCompleted: boolean;
  juzLabel: string;
  juzIds: number[];
  mainJuzId: number;
  juzName: string;
}

export const KhatmPlanner: React.FC = () => {
  const {
    khatmPlan,
    saveKhatmPlan,
    toggleKhatmDayCompleted,
    deleteKhatmPlan,
    resetKhatmPlanProgress,
    juzList,
    currentJuzId,
    isPlaying,
    selectJuz,
    play,
    pause,
  } = useApp();

  const todayStr = getLocalDateString();

  // Form State for creating/editing a Khatm Plan
  const [isEditing, setIsEditing] = useState(false);
  const [formStartDate, setFormStartDate] = useState(todayStr);
  const [formStartJuz, setFormStartJuz] = useState(1);
  const [formDurationDays, setFormDurationDays] = useState(30);
  const [formAmountPerDay, setFormAmountPerDay] = useState(1);

  // Filter for schedule list
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "completed">("all");

  // Ref to today's schedule row for "Jump to Today"
  const todayRowRef = useRef<HTMLDivElement | null>(null);

  // Sync form inputs when editing begins or when plan changes
  useEffect(() => {
    if (khatmPlan) {
      setFormStartDate(khatmPlan.startDate);
      setFormStartJuz(khatmPlan.startJuz);
      setFormDurationDays(khatmPlan.durationDays);
      setFormAmountPerDay(khatmPlan.amountPerDay);
    } else {
      setFormStartDate(todayStr);
      setFormStartJuz(1);
      setFormDurationDays(30);
      setFormAmountPerDay(1);
    }
  }, [khatmPlan, todayStr]);

  // Compute calculated values when a plan is active
  const scheduleData = useMemo(() => {
    if (!khatmPlan) return null;

    const { startDate, startJuz, durationDays, amountPerDay, completedDays = [] } = khatmPlan;

    const days: DayScheduleItem[] = [];
    const completedSet = new Set(completedDays);

    for (let i = 0; i < durationDays; i++) {
      const dateStr = addDaysToDateStr(startDate, i);
      const isToday = dateStr === todayStr;
      const isPast = dateStr < todayStr;
      const isFuture = dateStr > todayStr;
      const isCompleted = completedSet.has(i);

      let juzLabel = "";
      const juzIds: number[] = [];

      if (amountPerDay === 1) {
        const jId = ((startJuz - 1 + i) % 30) + 1;
        juzIds.push(jId);
        juzLabel = `Juz ${jId}`;
      } else if (amountPerDay > 1) {
        const fromIdx = Math.floor(i * amountPerDay);
        const toIdx = Math.floor((i + 1) * amountPerDay);
        for (let k = fromIdx; k < toIdx; k++) {
          const jId = ((startJuz - 1 + k) % 30) + 1;
          juzIds.push(jId);
        }
        if (juzIds.length === 1) {
          juzLabel = `Juz ${juzIds[0]}`;
        } else {
          juzLabel = `Juz ${juzIds[0]} - ${juzIds[juzIds.length - 1]}`;
        }
      } else {
        // Fractional amount (e.g. 0.5 = 2 days per Juz)
        const partsPerJuz = Math.round(1 / amountPerDay);
        const juzOffset = Math.floor(i * amountPerDay);
        const jId = ((startJuz - 1 + juzOffset) % 30) + 1;
        const partNumber = (i % partsPerJuz) + 1;
        juzIds.push(jId);
        juzLabel = `Juz ${jId} (Part ${partNumber}/${partsPerJuz})`;
      }

      const mainJuzId = juzIds[0] || 1;
      const info = juzList.find((j) => j.id === mainJuzId);
      const juzName = info ? info.customName || info.defaultName : `Juz ${mainJuzId}`;

      days.push({
        dayIndex: i,
        dayNumber: i + 1,
        dateStr,
        isToday,
        isPast,
        isFuture,
        isCompleted,
        juzLabel,
        juzIds,
        mainJuzId,
        juzName,
      });
    }

    // Calculate Scheduled Target Progress (how many days user should have listened to by today)
    let scheduledDaysSoFar = 0;
    if (todayStr >= startDate) {
      const [sy, sm, sd] = startDate.split("-").map(Number);
      const [ty, tm, td] = todayStr.split("-").map(Number);
      const startD = new Date(sy, sm - 1, sd);
      const todayD = new Date(ty, tm - 1, td);
      const diffMs = todayD.getTime() - startD.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
      scheduledDaysSoFar = Math.min(durationDays, Math.max(0, diffDays));
    }

    const completedCount = completedDays.length;
    const targetEndDateStr = addDaysToDateStr(startDate, durationDays - 1);
    const isFinished = completedCount >= durationDays;
    const paceDiff = completedCount - scheduledDaysSoFar;

    return {
      days,
      completedCount,
      scheduledDaysSoFar,
      targetEndDateStr,
      isFinished,
      paceDiff,
      durationDays,
    };
  }, [khatmPlan, todayStr, juzList]);

  // Handle plan save
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan: KhatmPlan = {
      id: khatmPlan?.id || "khatm_" + Date.now().toString(36),
      title: "Quran Khatm Plan",
      startDate: formStartDate,
      startJuz: Number(formStartJuz),
      durationDays: Number(formDurationDays),
      amountPerDay: Number(formAmountPerDay),
      completedDays: khatmPlan?.completedDays || [],
      isCompleted: false,
      createdAt: khatmPlan?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveKhatmPlan(newPlan);
    setIsEditing(false);
  };

  // Quick Presets
  const applyPreset = (duration: number, amount: number, startJuzNum = 1) => {
    setFormStartDate(todayStr);
    setFormStartJuz(startJuzNum);
    setFormDurationDays(duration);
    setFormAmountPerDay(amount);
  };

  // Jump to Today
  const handleJumpToToday = () => {
    if (todayRowRef.current) {
      todayRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Play audio for a given Juz
  const handlePlayJuz = (juzId: number) => {
    if (currentJuzId === juzId && isPlaying) {
      pause();
    } else {
      selectJuz(juzId);
      setTimeout(() => {
        play();
      }, 100);
    }
  };

  // Filtered days list
  const displayedDays = useMemo(() => {
    if (!scheduleData) return [];
    if (filterMode === "completed") {
      return scheduleData.days.filter((d) => d.isCompleted);
    }
    if (filterMode === "pending") {
      return scheduleData.days.filter((d) => !d.isCompleted);
    }
    return scheduleData.days;
  }, [scheduleData, filterMode]);

  return (
    <section className="w-full bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl p-4 sm:p-7 backdrop-blur-xl shadow-xl space-y-5 sm:space-y-6 transition-colors duration-200">
      {/* Header without icon and subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-content-primary">
            Khatm Planner
          </h2>
          {khatmPlan && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active Khatm
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {khatmPlan ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium border border-surface-border bg-surface-subtle hover:bg-surface-hover text-content-primary flex items-center gap-1.5 transition active:scale-95"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isEditing ? "Cancel" : "Edit Plan"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Reset completed days for this Khatm?")) {
                    resetKhatmPlanProgress();
                  }
                }}
                title="Reset progress"
                className="p-2 rounded-xl text-xs font-medium border border-surface-border bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this Khatm plan?")) {
                    deleteKhatmPlan();
                    setIsEditing(false);
                  }
                }}
                title="Delete Khatm plan"
                className="p-2 rounded-xl text-xs font-medium border border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white shadow-md hover:opacity-90 active:scale-95 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Plan a Khatm</span>
            </button>
          )}
        </div>
      </div>

      {/* Plan Creation / Edit Form */}
      {(isEditing || !khatmPlan) && (
        <form
          onSubmit={handleSavePlan}
          className="p-4 sm:p-6 rounded-2xl bg-surface-subtle/70 border border-surface-border space-y-4 sm:space-y-5 animate-in fade-in duration-300"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-content-primary flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-primary" />
              {khatmPlan ? "Edit Listening Schedule" : "Start New Khatm Plan"}
            </h3>
            {khatmPlan && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-content-muted hover:text-content-primary"
              >
                Close
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-medium text-content-muted mb-2">
              Quick Templates
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(30, 1)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                  formDurationDays === 30 && formAmountPerDay === 1
                    ? "bg-brand-light border-brand-primary text-brand-primary font-semibold"
                    : "bg-surface-card border-surface-border text-content-secondary hover:bg-surface-hover"
                }`}
              >
                <div className="font-semibold text-content-primary">🌙 Ramadan 30-Day</div>
                <div className="text-[10px] text-content-muted">1 Juz/day • 30 days</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(10, 3)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                  formDurationDays === 10 && formAmountPerDay === 3
                    ? "bg-brand-light border-brand-primary text-brand-primary font-semibold"
                    : "bg-surface-card border-surface-border text-content-secondary hover:bg-surface-hover"
                }`}
              >
                <div className="font-semibold text-content-primary">⚡ 10-Day Intensive</div>
                <div className="text-[10px] text-content-muted">3 Juzes/day • 10 days</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(15, 2)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                  formDurationDays === 15 && formAmountPerDay === 2
                    ? "bg-brand-light border-brand-primary text-brand-primary font-semibold"
                    : "bg-surface-card border-surface-border text-content-secondary hover:bg-surface-hover"
                }`}
              >
                <div className="font-semibold text-content-primary">🎯 15-Day Pace</div>
                <div className="text-[10px] text-content-muted">2 Juzes/day • 15 days</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(60, 0.5)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition ${
                  formDurationDays === 60 && formAmountPerDay === 0.5
                    ? "bg-brand-light border-brand-primary text-brand-primary font-semibold"
                    : "bg-surface-card border-surface-border text-content-secondary hover:bg-surface-hover"
                }`}
              >
                <div className="font-semibold text-content-primary">🌿 60-Day Gentle</div>
                <div className="text-[10px] text-content-muted">0.5 Juz/day • 60 days</div>
              </button>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Start Date */}
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                required
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-card border border-surface-border text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>

            {/* 2. Start Juz Number */}
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                Start Juz Number
              </label>
              <select
                value={formStartJuz}
                onChange={(e) => setFormStartJuz(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-card border border-surface-border text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              >
                {juzList.map((j) => (
                  <option key={j.id} value={j.id}>
                    Juz {j.id} — {j.customName || j.defaultName}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Duration (Days) */}
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                Duration (Days)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={formDurationDays}
                  onChange={(e) => setFormDurationDays(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl bg-surface-card border border-surface-border text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormDurationDays((prev) => Math.max(1, prev - 5))}
                    className="p-2 rounded-lg bg-surface-card border border-surface-border hover:bg-surface-hover text-content-secondary text-xs"
                    title="-5 days"
                  >
                    -5
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDurationDays((prev) => prev + 5)}
                    className="p-2 rounded-lg bg-surface-card border border-surface-border hover:bg-surface-hover text-content-secondary text-xs"
                    title="+5 days"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Daily Amount (Juzes per Day) */}
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1.5">
                Amount (Juzes / Day)
              </label>
              <select
                value={formAmountPerDay}
                onChange={(e) => setFormAmountPerDay(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-surface-card border border-surface-border text-xs text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              >
                <option value={0.5}>0.5 Juz / day (Half a Juz)</option>
                <option value={1}>1.0 Juz / day (1 Juz daily)</option>
                <option value={1.5}>1.5 Juzes / day</option>
                <option value={2}>2.0 Juzes / day</option>
                <option value={3}>3.0 Juzes / day</option>
                <option value={4}>4.0 Juzes / day</option>
                <option value={5}>5.0 Juzes / day</option>
              </select>
            </div>
          </div>

          {/* Dynamic Summary calculation */}
          <div className="p-3.5 rounded-xl bg-brand-light/50 border border-brand-primary/20 text-xs text-content-primary flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <p>
              Plan Summary: At <span className="font-bold text-brand-primary">{formAmountPerDay} Juz/day</span> for{" "}
              <span className="font-bold text-brand-primary">{formDurationDays} days</span>, you will listen to approximately{" "}
              <span className="font-bold text-brand-primary">{Math.round(formDurationDays * formAmountPerDay)} Juzes</span>, starting from{" "}
              <span className="font-semibold">{formatHumanDate(formStartDate)}</span> (Juz {formStartJuz}) and reaching the finish line on{" "}
              <span className="font-semibold">{formatHumanDate(addDaysToDateStr(formStartDate, formDurationDays - 1))}</span>.
            </p>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {khatmPlan && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-surface-border text-content-secondary hover:bg-surface-hover"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white shadow-md hover:opacity-90 active:scale-95 transition flex items-center gap-2"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{khatmPlan ? "Save Khatm Changes" : "Start Khatm Plan"}</span>
            </button>
          </div>
        </form>
      )}

      {/* When a plan is active: render Brick Progress Bars, Finish Line, and Schedule */}
      {scheduleData && (
        <div className="space-y-5 sm:space-y-6">
          {/* Plan Meta Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
              <div className="text-[11px] font-medium text-content-muted">Start Date</div>
              <div className="text-xs sm:text-sm font-bold text-content-primary mt-0.5">
                {formatHumanDate(khatmPlan!.startDate)}
              </div>
              <div className="text-[10px] text-brand-primary font-medium mt-0.5">
                Start at Juz {khatmPlan!.startJuz}
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
              <div className="text-[11px] font-medium text-content-muted">Target Finish Date</div>
              <div className="text-xs sm:text-sm font-bold text-content-primary mt-0.5">
                {formatHumanDate(scheduleData.targetEndDateStr)}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">
                {scheduleData.durationDays} days total
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
              <div className="text-[11px] font-medium text-content-muted">Daily Target</div>
              <div className="text-xs sm:text-sm font-bold text-content-primary mt-0.5">
                {khatmPlan!.amountPerDay} Juz / day
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">
                {Math.round(khatmPlan!.durationDays * khatmPlan!.amountPerDay)} Juzes target
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-surface-subtle border border-surface-border">
              <div className="text-[11px] font-medium text-content-muted">Pace Status</div>
              <div className="text-xs sm:text-sm font-bold text-content-primary mt-0.5 flex items-center gap-1.5">
                {scheduleData.isFinished ? (
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Finished!
                  </span>
                ) : scheduleData.paceDiff > 0 ? (
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> +{scheduleData.paceDiff} Ahead
                  </span>
                ) : scheduleData.paceDiff === 0 ? (
                  <span className="text-sky-500 font-bold">On Schedule</span>
                ) : (
                  <span className="text-amber-500 font-bold">
                    {Math.abs(scheduleData.paceDiff)} Behind
                  </span>
                )}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5">
                {scheduleData.completedCount} of {scheduleData.durationDays} days done
              </div>
            </div>
          </div>

          {/* FINISH LINE CELEBRATION CARD */}
          {scheduleData.isFinished && (
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-brand-primary/15 border-2 border-emerald-500/40 shadow-lg text-content-primary space-y-3 animate-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500 text-white shadow-md">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-content-primary flex items-center gap-2">
                    <span>🎉 Mabrook! Khatm Completed!</span>
                  </h3>
                  <p className="text-xs text-content-secondary mt-0.5">
                    Alhamdulillah! You have reached the finish line by completing all {scheduleData.durationDays} days of your Quran listening journey.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Restart this Khatm journey from Day 1?")) {
                      resetKhatmPlanProgress();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition active:scale-95 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Journey</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-surface-border bg-surface-card hover:bg-surface-hover text-content-primary transition active:scale-95 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Plan Next Khatm</span>
                </button>
              </div>
            </div>
          )}

          {/* DUAL-TRACK PROGRESS BARS WITH DAILY BRICK BLOCKS & DOTTED FINISH LINE */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-surface-subtle/80 border border-surface-border space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-content-primary flex items-center gap-1.5">
                  <Flag className="w-4 h-4 text-brand-primary shrink-0" />
                  <span>Khatm Race Track (Daily Bricks)</span>
                </h3>
                <p className="text-[11px] text-content-muted mt-0.5">
                  Daily brick blocks progressing toward the vertical finish line
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-[11px] font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block shadow-sm shrink-0" />
                  <span className="text-content-secondary">Completed Listenings</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-sky-500 inline-block shadow-sm shrink-0" />
                  <span className="text-content-secondary">Scheduled Pace (Today)</span>
                </div>
              </div>
            </div>

            {/* Mobile swipe hint */}
            <div className="text-[10px] text-content-muted flex items-center justify-end gap-1 sm:hidden">
              <span>Scroll track</span>
              <span>→</span>
            </div>

            {/* The Track Container */}
            <div className="relative overflow-x-auto pb-2 scrollbar-thin">
              <div className="min-w-[640px] flex items-stretch pr-10">
                {/* Track lanes for the brick blocks */}
                <div className="flex-1 space-y-3 pr-4">
                  {/* Lane 1: Completed Listenings Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-content-secondary px-0.5">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Completed Listenings
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {scheduleData.completedCount} / {scheduleData.durationDays} Days (
                        {Math.round((scheduleData.completedCount / scheduleData.durationDays) * 100)}%)
                      </span>
                    </div>

                    {/* Brick Blocks Row 1 */}
                    <div className="flex items-center gap-1 sm:gap-1.5 h-8 p-1 rounded-xl bg-surface-card border border-surface-border">
                      {scheduleData.days.map((day) => {
                        const isDone = day.isCompleted;
                        return (
                          <button
                            key={`completed-brick-${day.dayIndex}`}
                            type="button"
                            onClick={() => toggleKhatmDayCompleted(day.dayIndex)}
                            title={`Day ${day.dayNumber} (${formatHumanDate(day.dateStr)}): ${
                              day.juzLabel
                            } • ${isDone ? "Completed (tap to undo)" : "Tap to mark done"}`}
                            className={`flex-1 h-full rounded-md transition-all duration-200 cursor-pointer flex items-center justify-center text-[10px] font-bold ${
                              isDone
                                ? "bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-400/50 active:scale-95"
                                : "bg-surface-subtle/80 hover:bg-surface-hover text-content-muted/40 border border-surface-border/60 hover:border-emerald-500/50"
                            }`}
                          >
                            {isDone ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lane 2: Scheduled Target Pace Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-content-secondary px-0.5">
                      <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                        <Calendar className="w-3.5 h-3.5" />
                        Scheduled Target Pace
                      </span>
                      <span className="font-mono text-sky-600 dark:text-sky-400">
                        Day {scheduleData.scheduledDaysSoFar} of {scheduleData.durationDays} (Target for Today)
                      </span>
                    </div>

                    {/* Brick Blocks Row 2 */}
                    <div className="flex items-center gap-1 sm:gap-1.5 h-8 p-1 rounded-xl bg-surface-card border border-surface-border">
                      {scheduleData.days.map((day) => {
                        const isScheduled = day.dayNumber <= scheduleData.scheduledDaysSoFar;
                        const isTargetToday = day.isToday;
                        return (
                          <div
                            key={`schedule-brick-${day.dayIndex}`}
                            title={`Day ${day.dayNumber} (${formatHumanDate(day.dateStr)}): ${
                              day.juzLabel
                            } • ${isTargetToday ? "Today's Target!" : isScheduled ? "Scheduled" : "Upcoming"}`}
                            className={`flex-1 h-full rounded-md transition-all duration-200 flex items-center justify-center text-[10px] font-bold ${
                              isTargetToday
                                ? "bg-sky-500 text-white shadow-md ring-2 ring-sky-300 dark:ring-sky-500 animate-pulse"
                                : isScheduled
                                ? "bg-sky-500/85 text-white shadow-sm ring-1 ring-sky-400/30"
                                : "bg-surface-subtle/80 text-content-muted/40 border border-surface-border/60"
                            }`}
                          >
                            {isTargetToday && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* THE DOTTED VERTICAL FINISH LINE */}
                <div className="w-20 shrink-0 flex flex-col items-center justify-center relative border-l-2 border-dashed border-content-muted/70 pl-3">
                  <div className="flex flex-col items-center gap-1 text-center select-none">
                    <div className="w-7 h-7 rounded-xl bg-surface-card border border-surface-border flex items-center justify-center text-sm shadow-sm">
                      🏁
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase text-content-primary">
                      Finish
                    </span>
                    <span className="text-[9px] font-medium text-content-muted whitespace-nowrap">
                      {formatHumanDate(scheduleData.targetEndDateStr)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* DAY-BY-DAY SCHEDULE LIST (Icon removed from header) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2">
              <div>
                <h3 className="text-sm font-bold text-content-primary">
                  Day-by-Day Listening Schedule
                </h3>
                <p className="text-xs text-content-muted">
                  What to listen to each day of the Khatm journey
                </p>
              </div>

              {/* Filters & Jump to Today */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-brand-light text-brand-primary border border-brand-primary/20 hover:bg-brand-light/80 transition active:scale-95"
                >
                  Jump to Today
                </button>

                <div className="flex items-center p-0.5 rounded-xl bg-surface-subtle border border-surface-border text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterMode("all")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      filterMode === "all"
                        ? "bg-surface-card font-semibold text-content-primary shadow-sm"
                        : "text-content-muted hover:text-content-primary"
                    }`}
                  >
                    All ({scheduleData.durationDays})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("pending")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      filterMode === "pending"
                        ? "bg-surface-card font-semibold text-content-primary shadow-sm"
                        : "text-content-muted hover:text-content-primary"
                    }`}
                  >
                    Pending ({scheduleData.durationDays - scheduleData.completedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("completed")}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      filterMode === "completed"
                        ? "bg-surface-card font-semibold text-content-primary shadow-sm"
                        : "text-content-muted hover:text-content-primary"
                    }`}
                  >
                    Done ({scheduleData.completedCount})
                  </button>
                </div>
              </div>
            </div>

            {/* List of Days */}
            <div className="divide-y divide-surface-border max-h-[460px] overflow-y-auto pr-1 rounded-2xl border border-surface-border bg-surface-subtle/40">
              {displayedDays.map((day) => {
                const isCurrentPlayingJuz =
                  day.juzIds.includes(currentJuzId) && isPlaying;

                let rowBg = "hover:bg-surface-hover/60";
                if (day.isToday) {
                  rowBg = "bg-brand-light/70 dark:bg-brand-primary/15 border-l-4 border-l-brand-primary";
                } else if (day.isCompleted) {
                  rowBg = "bg-emerald-500/5 dark:bg-emerald-500/10";
                }

                return (
                  <div
                    key={`schedule-row-${day.dayIndex}`}
                    ref={day.isToday ? todayRowRef : undefined}
                    className={`p-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 transition-colors ${rowBg}`}
                  >
                    {/* Left: Checkbox + Day info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Completed Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleKhatmDayCompleted(day.dayIndex)}
                        title={day.isCompleted ? "Mark undone" : "Mark completed"}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition cursor-pointer ${
                          day.isCompleted
                            ? "bg-emerald-500 text-white shadow-md ring-2 ring-emerald-500/30 active:scale-95"
                            : "bg-surface-card border border-surface-border text-content-muted hover:text-content-primary hover:border-emerald-500"
                        }`}
                      >
                        {day.isCompleted ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <span className="font-mono text-[11px]">{day.dayNumber}</span>
                        )}
                      </button>

                      {/* Day Label & Juz Assignment */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-content-primary">
                            Day {day.dayNumber}
                          </span>
                          <span className="text-[11px] text-content-muted">
                            • {formatHumanDate(day.dateStr)}
                          </span>

                          {day.isToday && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary text-white shadow-xs">
                              Today
                            </span>
                          )}

                          {day.isCompleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Completed
                            </span>
                          )}

                          {!day.isCompleted && day.isPast && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Behind
                            </span>
                          )}
                        </div>

                        {/* Juz Info */}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              day.isCompleted
                                ? "text-content-muted line-through opacity-80"
                                : "text-content-primary"
                            }`}
                          >
                            {day.juzLabel}
                          </span>
                          <span className="text-xs text-content-muted truncate hidden sm:inline">
                            — {day.juzName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Listen / Play Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePlayJuz(day.mainJuzId)}
                        title={`Listen to Juz ${day.mainJuzId}`}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                          isCurrentPlayingJuz
                            ? "bg-brand-primary text-white shadow-md animate-pulse"
                            : "bg-surface-card border border-surface-border text-content-secondary hover:text-content-primary hover:border-brand-primary/50"
                        }`}
                      >
                        {isCurrentPlayingJuz ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span className="hidden sm:inline">Playing</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span className="hidden sm:inline">Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
