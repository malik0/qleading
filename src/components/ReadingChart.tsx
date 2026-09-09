"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { Clock3, Info, Focus, ChevronLeft, ChevronRight } from "lucide-react";
import { formatAudioTime, getLocalDateString } from "../lib/utils";

export const ReadingChart: React.FC = () => {
  const { todayRecord, historyRecords } = useApp();
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0); // 0 = today, 1 = yesterday, ...
  const [hoveredSlot, setHoveredSlot] = useState<{
    timeLabel: string;
    seconds: number;
    isNow?: boolean;
  } | null>(null);

  const [currentHour, setCurrentHour] = useState<number | null>(null);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const currentHourRowRef = useRef<HTMLDivElement | null>(null);
  const hasInitialCenteredRef = useRef(false);

  // Keep current hour and 15-minute slot synced with live time
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const slot = hour * 4 + Math.floor(now.getMinutes() / 15);
      setCurrentHour(hour);
      setCurrentSlotIndex(slot);
    };

    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 15000); // Check every 15s

    return () => clearInterval(intervalId);
  }, []);

  const scrollToCurrentHour = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    const target = currentHourRowRef.current;
    if (!container || !target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const currentOffset = targetRect.top - containerRect.top;
    const targetOffset = (containerRect.height - targetRect.height) / 2;
    const delta = currentOffset - targetOffset;

    container.scrollTo({
      top: Math.max(0, container.scrollTop + delta),
      behavior,
    });
  }, []);

  // Auto center-focus the current hour on initial load
  useEffect(() => {
    if (currentHour !== null && !hasInitialCenteredRef.current) {
      hasInitialCenteredRef.current = true;
      const timer = setTimeout(() => {
        scrollToCurrentHour("auto");
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [currentHour, scrollToCurrentHour]);

  // Selected Day Calculation
  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - selectedDayOffset);
    return d;
  }, [selectedDayOffset]);

  const selectedDateStr = useMemo(() => {
    return getLocalDateString(selectedDate);
  }, [selectedDate]);

  const isSelectedDayToday = selectedDayOffset === 0;

  const activeDayRecord = useMemo(() => {
    if (isSelectedDayToday) return todayRecord;
    return (
      historyRecords[selectedDateStr] || {
        date: selectedDateStr,
        secondsRead: 0,
        targetReached: false,
        slots: {},
        juzCompletedCount: 0,
        completedJuzIds: [],
      }
    );
  }, [isSelectedDayToday, todayRecord, historyRecords, selectedDateStr]);

  const formattedDayLabel = useMemo(() => {
    if (selectedDayOffset === 0) {
      return `Today (${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
    }
    if (selectedDayOffset === 1) {
      return `Yesterday (${selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
    }
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, [selectedDayOffset, selectedDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Helper to get slot style dynamically based on reading seconds (max 900s in 15min)
  const getSlotStyle = (seconds: number): React.CSSProperties => {
    if (!seconds || seconds <= 0) return {};
    if (seconds < 180) {
      return {
        backgroundColor: "rgba(var(--color-primary-rgb), 0.22)",
        borderColor: "rgba(var(--color-primary-rgb), 0.35)",
        color: "var(--color-primary)",
      };
    }
    if (seconds < 450) {
      return {
        backgroundColor: "rgba(var(--color-primary-rgb), 0.5)",
        borderColor: "rgba(var(--color-primary-rgb), 0.65)",
        color: "#ffffff",
        fontWeight: 600,
      };
    }
    if (seconds < 750) {
      return {
        backgroundColor: "rgba(var(--color-primary-rgb), 0.78)",
        borderColor: "rgba(var(--color-primary-rgb), 0.9)",
        color: "#ffffff",
        fontWeight: 700,
      };
    }
    return {
      backgroundColor: "var(--color-primary)",
      borderColor: "var(--color-primary-hover)",
      color: "#ffffff",
      fontWeight: 800,
      boxShadow: "0 2px 8px var(--color-primary-glow)",
    };
  };

  const totalMinutesForDay = Math.round((activeDayRecord.secondsRead || 0) / 60);

  return (
    <div className="w-full bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-xl space-y-4 transition-colors duration-200">
      {/* Chart Title, Day Navigation & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-content-primary">24-Hour Reading Timeline</h2>
            {isSelectedDayToday && currentHour !== null && (
              <button
                type="button"
                onClick={() => scrollToCurrentHour("smooth")}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold text-brand-primary bg-brand-light hover:bg-brand-light/70 border border-brand-primary/20 transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Center focus current hour"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
                </span>
                <span>Now: {String(currentHour).padStart(2, "0")}:00</span>
                <Focus className="w-3 h-3 opacity-80" />
              </button>
            )}
          </div>

          {/* Requirement 5: Day Navigation Controls (Back & Forward across days) */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => setSelectedDayOffset((prev) => prev + 1)}
              title="View Previous Day"
              className="p-1 rounded-lg bg-surface-subtle hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border transition shadow-sm cursor-pointer active:scale-95 flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-content-primary font-mono px-2 py-0.5 rounded-lg bg-surface-subtle border border-surface-border select-none">
              {formattedDayLabel}
            </span>

            <button
              type="button"
              onClick={() => setSelectedDayOffset((prev) => Math.max(0, prev - 1))}
              disabled={isSelectedDayToday}
              title={isSelectedDayToday ? "Today is the latest date" : "View Next Day"}
              className={`p-1 rounded-lg border transition shadow-sm flex items-center justify-center ${
                isSelectedDayToday
                  ? "bg-surface-subtle/40 border-surface-border/50 text-content-muted/40 cursor-not-allowed"
                  : "bg-surface-subtle hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border cursor-pointer active:scale-95"
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isSelectedDayToday && (
              <button
                type="button"
                onClick={() => setSelectedDayOffset(0)}
                className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-brand-primary bg-brand-light hover:bg-brand-light/70 border border-brand-primary/20 transition cursor-pointer"
                title="Jump back to Today"
              >
                Today
              </button>
            )}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-content-muted block font-medium">
            {isSelectedDayToday ? "Total Today" : "Total for Day"}
          </span>
          <span className="text-sm font-bold text-brand-primary font-mono">
            {totalMinutesForDay} mins ({formatAudioTime(activeDayRecord.secondsRead || 0)})
          </span>
        </div>
      </div>

      {/* Hover Info Tooltip Banner */}
      <div className="min-h-[28px] flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-content-secondary">
        <div className="flex items-center gap-1.5">
          <Clock3 className="w-3.5 h-3.5 text-brand-primary shrink-0" />
          {hoveredSlot ? (
            <span className="flex items-center gap-1.5 truncate">
              <span>Time:</span>
              <strong className="text-content-primary">{hoveredSlot.timeLabel}</strong>
              {hoveredSlot.isNow && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-primary text-white font-semibold uppercase tracking-wider shrink-0">
                  Current
                </span>
              )}
            </span>
          ) : (
            <span className="text-content-muted truncate">Hover or tap on any 15-minute slot below</span>
          )}
        </div>
        {hoveredSlot && (
          <span className="font-mono text-brand-primary font-semibold shrink-0 ml-2">
            {Math.floor(hoveredSlot.seconds / 60)}m {hoveredSlot.seconds % 60}s read
          </span>
        )}
      </div>

      {/* 5.1 24-HOUR VERTICAL CHART WITH 15-MINUTE SLOTS */}
      <div
        ref={scrollContainerRef}
        className="space-y-1.5 max-h-96 overflow-y-auto overflow-x-hidden p-1 pr-2 scrollbar-thin relative"
      >
        {hours.map((hour) => {
          const isCurrentHour = isSelectedDayToday && currentHour === hour;
          const hourLabel = `${String(hour).padStart(2, "0")}:00`;
          const baseSlotIdx = hour * 4;

          return (
            <div
              key={hour}
              ref={isCurrentHour ? currentHourRowRef : undefined}
              className={`flex items-center gap-2 sm:gap-3 py-1.5 px-2 rounded-xl transition-all duration-200 ${
                isCurrentHour
                  ? "bg-brand-light/50 dark:bg-brand-light/15 border border-brand-primary/40 shadow-sm ring-1 ring-brand-primary/30"
                  : "border border-transparent hover:bg-surface-subtle/50"
              }`}
            >
              {/* Hour Label Column */}
              <div className="w-14 sm:w-16 shrink-0 flex items-center justify-end gap-1.5 text-xs font-mono select-none">
                {isCurrentHour && (
                  <span className="relative flex h-2 w-2 shrink-0" title="Current Hour">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary" />
                  </span>
                )}
                <span
                  className={
                    isCurrentHour
                      ? "font-bold text-brand-primary"
                      : "text-content-muted"
                  }
                >
                  {hourLabel}
                </span>
              </div>

              {/* 4 Segmented 15-Minute Slots (:00, :15, :30, :45) */}
              <div className="flex-1 grid grid-cols-4 gap-1.5 sm:gap-2">
                {[0, 1, 2, 3].map((subSlot) => {
                  const slotIndex = baseSlotIdx + subSlot;
                  const isCurrentSlot = isSelectedDayToday && isCurrentHour && currentSlotIndex === slotIndex;
                  const secInSlot = activeDayRecord.slots?.[slotIndex] || 0;
                  const startMin = String(subSlot * 15).padStart(2, "0");
                  const endMin = String((subSlot + 1) * 15).padStart(2, "0");
                  const slotTimeLabel = `${String(hour).padStart(2, "0")}:${startMin} - ${String(hour).padStart(2, "0")}:${endMin}`;
                  const dynamicStyle = getSlotStyle(secInSlot);

                  return (
                    <button
                      key={subSlot}
                      onMouseEnter={() =>
                        setHoveredSlot({
                          timeLabel: slotTimeLabel,
                          seconds: secInSlot,
                          isNow: isCurrentSlot,
                        })
                      }
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={() =>
                        setHoveredSlot({
                          timeLabel: slotTimeLabel,
                          seconds: secInSlot,
                          isNow: isCurrentSlot,
                        })
                      }
                      title={`${slotTimeLabel}${isCurrentSlot ? " (Current Slot)" : ""}: ${Math.floor(secInSlot / 60)}m ${secInSlot % 60}s`}
                      style={dynamicStyle}
                      className={`relative h-7 rounded-lg border transition-all flex items-center justify-center text-[10px] select-none ${
                        isCurrentSlot
                          ? "ring-2 ring-brand-primary ring-offset-1 ring-offset-surface-card font-semibold"
                          : ""
                      } ${
                        secInSlot <= 0
                          ? isCurrentSlot
                            ? "bg-brand-light/35 border-brand-primary/40 text-brand-primary font-semibold"
                            : "bg-surface-subtle/60 border-surface-border text-content-muted/50"
                          : ""
                      }`}
                    >
                      {secInSlot > 0 ? (
                        <span className="truncate px-1">
                          {Math.round(secInSlot / 60)}m
                        </span>
                      ) : (
                        <span
                          className={`text-[9px] ${
                            isCurrentSlot
                              ? "text-brand-primary font-bold"
                              : "text-content-muted/40 sm:hidden"
                          }`}
                        >
                          :{startMin}
                        </span>
                      )}
                      {isCurrentSlot && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-primary ring-2 ring-surface-card" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Note */}
      <div className="pt-2 border-t border-surface-border flex flex-wrap items-center justify-between gap-2 text-[11px] text-content-muted">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-content-muted shrink-0" />
          <span>Timer tracks duration actively as Quran audio plays</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1 items-center">
            <span className="w-3 h-3 rounded bg-surface-subtle border border-surface-border inline-block" />
            <span
              className="w-3 h-3 rounded inline-block"
              style={{ backgroundColor: "rgba(var(--color-primary-rgb), 0.25)" }}
            />
            <span
              className="w-3 h-3 rounded inline-block"
              style={{ backgroundColor: "rgba(var(--color-primary-rgb), 0.6)" }}
            />
            <span
              className="w-3 h-3 rounded inline-block"
              style={{ backgroundColor: "var(--color-primary)" }}
            />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
