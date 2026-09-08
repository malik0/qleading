"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { DayOfWeek } from "../types/quran";
import { getLocalDateString } from "../lib/utils";
import { Calendar, ChevronLeft, ChevronRight, Flame, Trophy } from "lucide-react";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]; // 0=Sun, 1=Mon, ..., 6=Sat

export const StreakCounter: React.FC = () => {
  const { historyRecords, settings, todayRecord } = useApp();
  const [showMonthlyCalendar, setShowMonthlyCalendar] = useState(false);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  const todayStr = getLocalDateString();
  const todayDate = new Date();

  // 4.2 WEEKLY VIEW BASED ON STREAK START DAY
  // Build the 7 days of the current streak week based on settings.streakStartDay
  const weeklyDays = useMemo(() => {
    const currentDayOfWeek = todayDate.getDay() as DayOfWeek;
    const startDay = settings.streakStartDay ?? 1; // default Monday (1)

    // Calculate diff to start day
    let diff = currentDayOfWeek - startDay;
    if (diff < 0) diff += 7;

    const startDate = new Date(todayDate);
    startDate.setDate(todayDate.getDate() - diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = getLocalDateString(d);
      const isPast = dateStr < todayStr;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      const record = historyRecords[dateStr];
      const completed = record?.targetReached || (isToday && todayRecord.targetReached);

      days.push({
        date: d,
        dateStr,
        dayLetter: DAY_LABELS[d.getDay()],
        dayNum: d.getDate(),
        isPast,
        isToday,
        isFuture,
        completed,
      });
    }
    return days;
  }, [historyRecords, settings.streakStartDay, todayRecord.targetReached, todayStr]);

  // 4.4 QUICK STATS: PAST 30 DAYS SUCCESS
  const stats30Days = useMemo(() => {
    let completedCount = 0;
    for (let i = 1; i <= 30; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      const dateStr = getLocalDateString(d);
      if (historyRecords[dateStr]?.targetReached) {
        completedCount++;
      }
    }
    // Also include today if completed
    if (todayRecord.targetReached) {
      completedCount++;
    }
    const percent = Math.round((completedCount / 30) * 100);
    return {
      completedCount,
      percent,
    };
  }, [historyRecords, todayRecord.targetReached]);

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
      const completed = record?.targetReached || (isToday && todayRecord.targetReached);

      daysArray.push({
        dateStr,
        day,
        isPast,
        isToday,
        isFuture,
        completed,
      });
    }
    return {
      monthLabel: firstDayOfMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      days: daysArray,
    };
  }, [calendarMonthOffset, historyRecords, todayRecord.targetReached, todayStr]);

  return (
    <div className="w-full bg-surface-card border border-surface-border rounded-3xl p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4 transition-colors duration-200">
      {/* Top Bar: Title & Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-brand-light text-brand-primary">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-base font-bold text-content-primary">Daily Streak</h2>
            <p className="text-xs text-content-muted">
              Target: {settings.timerTargetMinutes} min daily
            </p>
          </div>
        </div>

        {/* 4.4 30-Day Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-content-muted block font-medium">
              Past 30 Days
            </span>
            <span className="text-sm font-bold text-brand-primary font-mono">
              {stats30Days.completedCount}/30 ({stats30Days.percent}%)
            </span>
          </div>

          <button
            onClick={() => setShowMonthlyCalendar(true)}
            title="Open Monthly Calendar"
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border transition shadow-sm"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4.1 WEEKLY STREAK COUNTER (M T W T F S S inside circles) */}
      <div className="pt-2">
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {weeklyDays.map((item, idx) => {
            // Requirement 4.1:
            // If timer completes by reaching target: colored theme primary
            // If timer reaches midnight and timer has not been completed: colored gray
            let circleBg = "bg-surface-subtle border-surface-border text-content-muted"; // default / future

            if (item.completed) {
              // Target reached -> Theme Primary
              circleBg =
                "bg-brand-primary text-white font-bold border-transparent shadow-md scale-105";
            } else if (item.isPast) {
              // Midnight passed without completion -> Gray
              circleBg =
                "bg-surface-hover text-content-muted border-surface-border";
            } else if (item.isToday) {
              // In-progress today
              circleBg =
                "bg-surface-subtle border-2 border-brand-primary text-brand-primary animate-pulse";
            }

            return (
              <div
                key={idx}
                className="flex flex-col items-center flex-1 space-y-1.5"
              >
                {/* 4.1 Day Circle */}
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border text-sm sm:text-base font-bold transition-all select-none ${circleBg}`}
                >
                  {item.dayLetter}
                </div>
                {/* Date number */}
                <span className="text-[11px] font-mono text-content-muted">
                  {item.dayNum}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4.3 MONTHLY CALENDAR MODAL */}
      {showMonthlyCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card border border-surface-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            {/* Header with Month Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-brand-primary" />
                <h3 className="text-lg font-bold text-content-primary">
                  {calendarDays.monthLabel}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
                  className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-content-secondary border border-surface-border"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
                  className="p-1.5 rounded-lg bg-surface-subtle hover:bg-surface-hover text-content-secondary border border-surface-border"
                >
                  <ChevronRight className="w-4 h-4" />
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
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.days.map((dayItem, index) => {
                if (!dayItem) {
                  return <div key={`empty-${index}`} className="h-9" />;
                }

                let colorStyle = "bg-surface-subtle/50 border-surface-border text-content-muted/60";
                if (dayItem.completed) {
                  colorStyle = "bg-brand-primary text-white font-bold border-transparent shadow-sm";
                } else if (dayItem.isPast) {
                  colorStyle = "bg-surface-hover text-content-muted border-surface-border";
                } else if (dayItem.isToday) {
                  colorStyle = "bg-surface-subtle border-2 border-brand-primary text-brand-primary";
                }

                return (
                  <div
                    key={dayItem.dateStr}
                    title={`${dayItem.dateStr}: ${
                      dayItem.completed
                        ? "Target Completed"
                        : dayItem.isPast
                        ? "Not Completed"
                        : "Upcoming / Today"
                    }`}
                    className={`h-9 rounded-full flex items-center justify-center border text-xs font-medium ${colorStyle}`}
                  >
                    {dayItem.day}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-surface-border flex items-center justify-around text-xs text-content-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-brand-primary inline-block" />
                <span>Completed</span>
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
                className="w-full py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-primary font-medium text-sm border border-surface-border transition"
              >
                Close Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
