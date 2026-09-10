"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp } from "../context/AppContext";
import { DayOfWeek } from "../types/quran";
import { getLocalDateString } from "../lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  X,
  Pencil,
  Minus,
  Plus,
  Check,
  CheckCircle2,
  Clock,
} from "lucide-react";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]; // 0=Sun, 1=Mon, ..., 6=Sat

interface DayStatsData {
  date: Date;
  dateStr: string;
  formattedDate: string;
  secondsRead: number;
  completed: boolean;
  targetMinutes: number;
  juzCompletedCount: number;
  completedJuzIds: number[];
}

export const StreakCounter: React.FC = () => {
  const {
    historyRecords,
    settings,
    todayRecord,
    streakTargetMinutes,
    setStreakTargetMinutes,
    juzList,
  } = useApp();
  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [selectedDayStats, setSelectedDayStats] = useState<DayStatsData | null>(null);
  const [tempTargetMinutes, setTempTargetMinutes] = useState(streakTargetMinutes);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showMonthlyCalendar && !showTargetModal && !selectedDayStats) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMonthlyCalendar(false);
        setShowTargetModal(false);
        setSelectedDayStats(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showMonthlyCalendar, showTargetModal, selectedDayStats]);

  const todayStr = getLocalDateString();
  const todayDate = new Date();

  // 4.2 WEEKLY VIEW BASED ON STREAK START DAY
  const weeklyDays = useMemo(() => {
    const currentDayOfWeek = todayDate.getDay() as DayOfWeek;
    const startDay = settings.streakStartDay ?? 1; // default Monday (1)

    // Calculate diff to start day
    let diff = currentDayOfWeek - startDay;
    if (diff < 0) diff += 7;

    const startDate = new Date(todayDate);
    startDate.setDate(todayDate.getDate() - diff);

    const targetSeconds = (streakTargetMinutes || 30) * 60;

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = getLocalDateString(d);
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      const record = isToday ? todayRecord : historyRecords[dateStr];
      const juzCompletedCount = isToday
        ? todayRecord.juzCompletedCount || (todayRecord.completedJuzIds ? todayRecord.completedJuzIds.length : 0)
        : record?.juzCompletedCount || (record?.completedJuzIds ? record?.completedJuzIds.length : 0);
      const completedJuzIds = isToday
        ? todayRecord.completedJuzIds || []
        : record?.completedJuzIds || [];

      const completed = Boolean(
        record?.targetReached ||
        (isToday && todayRecord.targetReached) ||
        juzCompletedCount > 0
      );
      const secondsRead = isToday ? todayRecord.secondsRead : record?.secondsRead || 0;
      const progress = completed ? 1 : Math.min(1, Math.max(0, secondsRead / targetSeconds));

      days.push({
        date: d,
        dateStr,
        dayLetter: DAY_LABELS[d.getDay()],
        dayNum: d.getDate(),
        isPast,
        isToday,
        isFuture,
        completed,
        secondsRead,
        progress,
        juzCompletedCount,
        completedJuzIds,
      });
    }
    return days;
  }, [
    historyRecords,
    settings.streakStartDay,
    streakTargetMinutes,
    todayRecord.targetReached,
    todayRecord.secondsRead,
    todayRecord.juzCompletedCount,
    todayRecord.completedJuzIds,
    todayStr,
  ]);

  // 4.4 QUICK STATS: PAST 30 DAYS SUCCESS (UPDATED VIA JUZ TALLY & TARGET)
  const stats30Days = useMemo(() => {
    let completedCount = 0;
    for (let i = 1; i <= 30; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      const dateStr = getLocalDateString(d);
      const rec = historyRecords[dateStr];
      if (
        rec &&
        (rec.targetReached ||
          (rec.juzCompletedCount !== undefined && rec.juzCompletedCount > 0) ||
          (rec.completedJuzIds && rec.completedJuzIds.length > 0) ||
          (rec.secondsRead !== undefined && rec.secondsRead > 0))
      ) {
        completedCount++;
      }
    }
    // Also include today if completed or listened to
    if (
      todayRecord.targetReached ||
      (todayRecord.juzCompletedCount !== undefined && todayRecord.juzCompletedCount > 0) ||
      (todayRecord.completedJuzIds && todayRecord.completedJuzIds.length > 0) ||
      (todayRecord.secondsRead !== undefined && todayRecord.secondsRead > 0)
    ) {
      completedCount++;
    }
    const percent = Math.round((completedCount / 30) * 100);
    return {
      completedCount,
      percent,
    };
  }, [
    historyRecords,
    todayRecord.targetReached,
    todayRecord.juzCompletedCount,
    todayRecord.completedJuzIds,
    todayRecord.secondsRead,
  ]);

  // 4.3 MONTHLY CALENDAR VIEW DAYS
  const calendarDays = useMemo(() => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + calendarMonthOffset);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayOfWeek = firstDayOfMonth.getDay();
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const daysArray = [];
    // Padding before 1st of month
    for (let i = 0; i < startDayOfWeek; i++) {
      daysArray.push(null);
    }
    // Actual month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = getLocalDateString(d);
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;
      const record = historyRecords[dateStr];

      const juzCompletedCount = isToday
        ? todayRecord.juzCompletedCount || (todayRecord.completedJuzIds ? todayRecord.completedJuzIds.length : 0)
        : record?.juzCompletedCount || (record?.completedJuzIds ? record?.completedJuzIds.length : 0);
      const completedJuzIds = isToday
        ? todayRecord.completedJuzIds || []
        : record?.completedJuzIds || [];
      const secondsRead = isToday ? todayRecord.secondsRead : record?.secondsRead || 0;

      const completed = Boolean(
        record?.targetReached ||
        (isToday && todayRecord.targetReached) ||
        juzCompletedCount > 0
      );

      daysArray.push({
        date: d,
        dateStr,
        day,
        isPast,
        isToday,
        isFuture,
        completed,
        secondsRead,
        juzCompletedCount,
        completedJuzIds,
      });
    }
    return {
      monthLabel: firstDayOfMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      days: daysArray,
    };
  }, [
    calendarMonthOffset,
    historyRecords,
    todayRecord.targetReached,
    todayRecord.secondsRead,
    todayRecord.juzCompletedCount,
    todayRecord.completedJuzIds,
    todayStr,
  ]);

  // Dynamically resolved stats for the day modal (reacts live during playback)
  const liveDayStats = useMemo(() => {
    if (!selectedDayStats) return null;
    const isToday = selectedDayStats.dateStr === todayStr;
    const rec = isToday ? todayRecord : historyRecords[selectedDayStats.dateStr];
    const juzCompletedCount = isToday
      ? todayRecord.juzCompletedCount || (todayRecord.completedJuzIds ? todayRecord.completedJuzIds.length : 0)
      : rec?.juzCompletedCount || (rec?.completedJuzIds ? rec?.completedJuzIds.length : 0);
    const completedJuzIds = isToday
      ? todayRecord.completedJuzIds || []
      : rec?.completedJuzIds || [];
    const secondsRead = isToday ? todayRecord.secondsRead : rec?.secondsRead || 0;
    const completed = Boolean(
      rec?.targetReached ||
      (isToday && todayRecord.targetReached) ||
      juzCompletedCount > 0
    );

    return {
      date: selectedDayStats.date,
      dateStr: selectedDayStats.dateStr,
      formattedDate: selectedDayStats.formattedDate,
      secondsRead,
      completed,
      targetMinutes: streakTargetMinutes,
      juzCompletedCount,
      completedJuzIds,
    };
  }, [
    selectedDayStats,
    todayRecord,
    historyRecords,
    streakTargetMinutes,
    todayStr,
  ]);

  return (
    <div className="w-full bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-xl space-y-4 transition-colors duration-200">
      {/* Top Bar: Title & Stats without daily streak icon */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-content-primary">Daily Streak</h2>
          <button
            onClick={() => {
              setTempTargetMinutes(streakTargetMinutes);
              setShowTargetModal(true);
            }}
            title="Click to adjust daily streak target"
            className="group flex items-center gap-1.5 text-xs text-content-muted hover:text-brand-primary transition cursor-pointer mt-0.5"
          >
            <span>Target: {streakTargetMinutes} min daily</span>
            <Pencil className="w-3 h-3 text-brand-primary opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* 4.4 30-Day Quick Stats */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="text-right">
            <span className="text-[11px] sm:text-xs text-content-muted block font-medium">
              Past 30 Days
            </span>
            <span className="text-xs sm:text-sm font-bold text-brand-primary font-mono">
              {stats30Days.completedCount}/30 ({stats30Days.percent}%)
            </span>
          </div>

          <button
            onClick={() => setShowMonthlyCalendar(true)}
            title="Open Monthly Calendar"
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border transition shadow-sm cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4.1 WEEKLY STREAK COUNTER (M T W T F S S inside circles) */}
      <div className="pt-2">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {weeklyDays.map((item, idx) => {
            const CIRCLE_RADIUS = 21;
            const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
            const strokeDashoffset = CIRCUMFERENCE * (1 - item.progress);

            // Daily Streak day circle background needs to be solid light blue once a single Juz is listened to or completed
            const isListenedOrCompleted = Boolean(
              item.completed ||
              (item.juzCompletedCount !== undefined && item.juzCompletedCount > 0) ||
              (item.completedJuzIds && item.completedJuzIds.length > 0) ||
              (item.secondsRead !== undefined && item.secondsRead > 0)
            );

            const tooltip = `${item.dateStr}: ${
              item.completed
                ? "Daily goal reached"
                : `${Math.round(item.progress * 100)}% completed`
            } (${Math.round(item.secondsRead / 60)}/${streakTargetMinutes}m) • Click for stats`;

            return (
              <button
                type="button"
                key={idx}
                className="flex flex-col items-center flex-1 space-y-1.5 cursor-pointer group hover:scale-105 active:scale-95 transition-all outline-none"
                onClick={() => {
                  setSelectedDayStats({
                    date: item.date,
                    dateStr: item.dateStr,
                    formattedDate: item.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                    secondsRead: item.secondsRead,
                    completed: item.completed,
                    targetMinutes: streakTargetMinutes,
                    juzCompletedCount: item.juzCompletedCount,
                    completedJuzIds: item.completedJuzIds,
                  });
                }}
                title={tooltip}
              >
                {/* 4.1 Day Circle with Solid Background & Progress Bar Border */}
                <div
                  className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center select-none transition-all duration-300 ${
                  className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center select-none transition-all duration-300 shrink-0 ${
                    isListenedOrCompleted
                      ? "bg-sky-400 text-slate-950 font-extrabold shadow-md shadow-sky-400/25 scale-105"
                      ? "bg-sky-400 text-slate-950 font-extrabold shadow-md shadow-sky-400/25"
                      : item.isToday
                      ? "bg-surface-subtle text-brand-primary font-bold shadow-inner"
                      : item.isPast
                      ? "bg-surface-hover text-content-muted"
                      : "bg-surface-subtle/70 text-content-muted"
                  }`}
                >
                  {/* SVG Circular Border Progress Bar */}
                  <svg
                    className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                    viewBox="0 0 48 48"
                  >
                    {/* Background track & fill */}
                    <circle
                      cx="24"
                      cy="24"
                      r={CIRCLE_RADIUS}
                      fill={isListenedOrCompleted ? "#38bdf8" : "none"}
                      stroke="currentColor"
                      strokeWidth="3"
                      className={
                        isListenedOrCompleted
                          ? "text-sky-400"
                          : item.isToday
                          ? "text-brand-primary/40"
                          : "text-surface-border"
                      }
                    />
                    {/* Progress stroke */}
                    {item.progress > 0 && !isListenedOrCompleted && (
                      <circle
                        cx="24"
                        cy="24"
                        r={CIRCLE_RADIUS}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                        className="text-brand-primary transition-all duration-500 ease-out"
                      />
                    )}
                  </svg>

                  {/* Date Initial (M, T, W, T, F, S, S) */}
                  <span
                    className={`relative z-10 text-xs sm:text-sm font-bold transition-all ${
                      isListenedOrCompleted
                        ? "text-slate-950 font-extrabold"
                        : item.isToday
                        ? "text-brand-primary font-bold"
                        : "text-content-muted"
                    }`}
                  >
                    {item.dayLetter}
                  </span>
                </div>

                {/* Requirement: Little dot/circle beneath it for every Juz finished that day */}
                {item.juzCompletedCount > 0 ? (
                  <div
                    className="flex items-center justify-center gap-0.5"
                    title={`${item.juzCompletedCount} Juz finished`}
                  >
                    {Array.from({ length: Math.min(item.juzCompletedCount, 4) }).map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={`w-1.5 h-1.5 rounded-full ${
                          isListenedOrCompleted
                            ? "bg-sky-400 ring-1 ring-sky-400/30"
                            : "bg-brand-primary ring-1 ring-brand-primary/30"
                        }`}
                      />
                    ))}
                    {item.juzCompletedCount > 4 && (
                      <span
                        className={`text-[9px] font-bold leading-none ${
                          isListenedOrCompleted ? "text-sky-400" : "text-brand-primary"
                        }`}
                      >
                        +{item.juzCompletedCount - 4}
                      </span>
                    )}
                  </div>
                ) : null}
                {/* Requirement: Space for dots preserved even if none */}
                <div
                  className="h-3.5 flex items-center justify-center gap-0.5 shrink-0"
                  title={item.juzCompletedCount > 0 ? `${item.juzCompletedCount} Juz finished` : undefined}
                >
                  {item.juzCompletedCount > 0 && (
                    <>
                      {Array.from({ length: Math.min(item.juzCompletedCount, 4) }).map((_, dotIdx) => (
                        <span
                          key={dotIdx}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isListenedOrCompleted
                              ? "bg-sky-400 ring-1 ring-sky-400/30"
                              : "bg-brand-primary ring-1 ring-brand-primary/30"
                          }`}
                        />
                      ))}
                      {item.juzCompletedCount > 4 && (
                        <span
                          className={`text-[9px] font-bold leading-none ${
                            isListenedOrCompleted ? "text-sky-400" : "text-brand-primary"
                          }`}
                        >
                          +{item.juzCompletedCount - 4}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Date number */}
                <span className="text-[10px] sm:text-[11px] font-mono text-content-muted">
                <span className="text-[10px] sm:text-[11px] font-mono text-content-muted leading-none shrink-0">
                  {item.dayNum}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4.3 MONTHLY CALENDAR MODAL */}
      {showMonthlyCalendar && mounted && createPortal(
        <div
          onClick={() => setShowMonthlyCalendar(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header with Month Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-primary shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-content-primary">
                  {calendarDays.monthLabel}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
                  title="Previous month"
                  className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-content-secondary border border-surface-border"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
                  title="Next month"
                  className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-content-secondary border border-surface-border"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowMonthlyCalendar(false)}
                  title="Close calendar"
                  className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary border border-surface-border transition ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-content-muted">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => (
                <div key={i} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid with Theme & Gray Circles */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.days.map((dayItem, index) => {
                if (!dayItem) {
                  return <div key={`empty-${index}`} className="h-10 sm:h-11" />;
                }

                let colorStyle = "bg-surface-subtle/50 border-surface-border text-content-muted/60";
                const isListenedOrCompleted = Boolean(
                  dayItem.completed ||
                  (dayItem.juzCompletedCount !== undefined && dayItem.juzCompletedCount > 0) ||
                  (dayItem.completedJuzIds && dayItem.completedJuzIds.length > 0) ||
                  (dayItem.secondsRead !== undefined && dayItem.secondsRead > 0)
                );
                if (isListenedOrCompleted) {
                  colorStyle = "bg-sky-400 text-slate-950 font-bold border-transparent shadow-sm";
                } else if (dayItem.isPast) {
                  colorStyle = "bg-surface-hover text-content-muted border-surface-border";
                } else if (dayItem.isToday) {
                  colorStyle = "bg-surface-subtle border-2 border-brand-primary text-brand-primary font-bold";
                }

                return (
                  <button
                    type="button"
                    key={dayItem.dateStr}
                    onClick={() => {
                      setSelectedDayStats({
                        date: dayItem.date,
                        dateStr: dayItem.dateStr,
                        formattedDate: dayItem.date.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }),
                        secondsRead: dayItem.secondsRead,
                        completed: dayItem.completed,
                        targetMinutes: streakTargetMinutes,
                        juzCompletedCount: dayItem.juzCompletedCount,
                        completedJuzIds: dayItem.completedJuzIds,
                      });
                    }}
                    title={`${dayItem.dateStr}: ${
                      dayItem.completed
                        ? "Target Completed"
                        : dayItem.isPast
                        ? "Not Completed"
                        : "Upcoming / Today"
                    } • Click for stats`}
                    className={`h-10 sm:h-11 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center border text-xs font-medium cursor-pointer transition-all hover:scale-105 active:scale-95 ${colorStyle}`}
                  >
                    <span className="leading-tight">{dayItem.day}</span>
                    {/* Multi-Juz dots in calendar */}
                    {dayItem.juzCompletedCount > 0 && (
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        {Array.from({ length: Math.min(dayItem.juzCompletedCount, 3) }).map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className={`w-1 h-1 rounded-full ${
                              isListenedOrCompleted ? "bg-slate-950" : "bg-brand-primary"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-surface-border flex items-center justify-around text-xs text-content-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-sky-400 inline-block" />
                <span>Completed / Read</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-surface-hover border border-surface-border inline-block" />
                <span>Missed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-brand-primary inline-block" />
                <span>Today</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowMonthlyCalendar(false)}
                className="w-full py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-primary font-medium text-sm border border-surface-border transition cursor-pointer"
              >
                Close Calendar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DAY READING STATS MODAL (CLICKED FROM STREAK OR CALENDAR) */}
      {(liveDayStats || selectedDayStats) && mounted && (() => {
        const activeStats = liveDayStats || selectedDayStats;
        if (!activeStats) return null;
        return createPortal(
          <div
            onClick={() => setSelectedDayStats(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl max-w-sm w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-light text-brand-primary">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-content-primary">
                      Reading Stats
                    </h3>
                    <p className="text-xs text-content-muted">
                      {activeStats.formattedDate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDayStats(null)}
                  title="Close"
                  className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary border border-surface-border transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Minutes Read Display */}
              <div className="bg-surface-subtle border border-surface-border rounded-2xl p-4 text-center space-y-1">
                <span className="text-xs text-content-muted font-medium uppercase tracking-wider block">
                  Total Reading Time
                </span>
                <div className="text-3xl font-extrabold font-mono text-content-primary">
                  {Math.round((activeStats.secondsRead || 0) / 60)} min
                </div>
                <p className="text-xs text-content-muted">
                  Daily Goal: {activeStats.targetMinutes} minutes
                </p>
              </div>

              {/* Target Status Pill */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle border border-surface-border">
                <span className="text-xs font-medium text-content-secondary">
                  Daily Goal Status
                </span>
                {activeStats.completed ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-brand-light px-2.5 py-1 rounded-full border border-brand-primary/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Target Reached
                  </span>
                ) : (
                  <span className="text-xs text-content-muted font-medium bg-surface-card px-2.5 py-1 rounded-full border border-surface-border">
                    {Math.max(
                      0,
                      activeStats.targetMinutes -
                        Math.round((activeStats.secondsRead || 0) / 60)
                    )}{" "}
                    min left
                  </span>
                )}
              </div>

              {/* Completed Juzes on this Day */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-content-muted uppercase tracking-wider block">
                  Juzes Completed This Day ({activeStats.juzCompletedCount || 0})
                </span>
                {activeStats.completedJuzIds && activeStats.completedJuzIds.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {activeStats.completedJuzIds.map((juzId, i) => {
                      const jInfo = juzList.find((j) => j.id === juzId);
                      return (
                        <div
                          key={`${juzId}-${i}`}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-brand-light/30 border border-brand-primary/20"
                        >
                          <span className="w-6 h-6 rounded-lg bg-brand-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {juzId}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold text-content-primary truncate block">
                              {jInfo?.customName || jInfo?.defaultName || `Juz ${juzId}`}
                            </span>
                          </div>
                          <Check className="w-3.5 h-3.5 text-brand-primary shrink-0 stroke-[2.5]" />
                        </div>
                      );
                    })}
                  </div>
                ) : (activeStats.juzCompletedCount || 0) > 0 ? (
                  <p className="text-xs text-brand-primary font-medium p-2.5 rounded-xl bg-brand-light/40 border border-brand-primary/20">
                    {activeStats.juzCompletedCount} Juz finished on this day
                  </p>
                ) : (
                  <p className="text-xs text-content-muted p-2 rounded-xl bg-surface-subtle text-center">
                    No Juz finished on this date
                  </p>
                )}
              </div>

            <button
              onClick={() => setSelectedDayStats(null)}
              className="w-full py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-primary font-medium text-xs border border-surface-border transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )})()}

      {/* DAILY STREAK TARGET MODAL */}
      {showTargetModal && mounted && createPortal(
        <div
          onClick={() => setShowTargetModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl max-w-sm w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 sm:p-2.5 rounded-xl bg-brand-light text-brand-primary shrink-0">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-content-primary">
                    Daily Streak Target
                  </h3>
                  <p className="text-xs text-content-muted">
                    Set daily reading habit goal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTargetModal(false)}
                title="Close"
                className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary border border-surface-border transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick presets */}
            <div>
              <label className="text-xs text-content-muted block mb-2 font-medium">
                Quick Presets:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 20, 30, 45, 60, 90].map((mins) => {
                  const isSelected = tempTargetMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTempTargetMinutes(mins)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition border cursor-pointer ${
                        isSelected
                          ? "bg-brand-primary text-white border-brand-primary shadow-md"
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
                Custom Target (1 - 720 minutes):
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTempTargetMinutes((prev) => Math.max(1, prev - 5))}
                  title="Decrease by 5 minutes"
                  className="p-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={tempTargetMinutes}
                  onChange={(e) =>
                    setTempTargetMinutes(
                      Math.max(1, Math.min(720, parseInt(e.target.value, 10) || 1))
                    )
                  }
                  className="flex-1 bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-center text-base font-mono font-bold text-content-primary focus:outline-none focus:border-brand-primary"
                />
                <button
                  type="button"
                  onClick={() => setTempTargetMinutes((prev) => Math.min(720, prev + 5))}
                  title="Increase by 5 minutes"
                  className="p-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowTargetModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-secondary font-medium text-xs border border-surface-border transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setStreakTargetMinutes(tempTargetMinutes);
                  setShowTargetModal(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-hover text-white font-bold text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Target</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
