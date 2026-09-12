"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { formatAudioTime } from "../lib/utils";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Volume2,
} from "lucide-react";
import { AyahMarker } from "../types/quran";
import { MushafModal } from "./MushafModal";

export const AyahMarkerDisplay: React.FC = () => {
  const {
    currentMarkers,
    currentMarker,
    currentMarkerIndex,
    seekToMarker,
    seekTo,
    playbackPosition,
    isPlaying,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Auto-scroll list to active marker when opened or when marker changes while open
  useEffect(() => {
    if (isOpen && listRef.current && currentMarkerIndex >= 0 && !searchQuery) {
      const itemHeight = 44;
      const targetScroll = Math.max(0, (currentMarkerIndex - 2) * itemHeight);
      listRef.current.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
  }, [isOpen, currentMarkerIndex, searchQuery]);

  // Filtered markers for search
  const filteredMarkers = useMemo(() => {
    if (!searchQuery.trim()) return currentMarkers;
    const q = searchQuery.toLowerCase().trim();
    return currentMarkers.filter((m) => {
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchSurah = m.surahName.toLowerCase().includes(q);
      const matchAyah = `${m.ayahNumber}`.includes(q);
      const matchSurahAyah = `${m.surahNumber}:${m.ayahNumber}`.includes(q);
      return matchTitle || matchSurah || matchAyah || matchSurahAyah;
    });
  }, [currentMarkers, searchQuery]);

  if (!currentMarkers || currentMarkers.length === 0) {
    return null;
  }

  const hasPrev = currentMarkerIndex > 0;
  const hasNext = currentMarkerIndex < currentMarkers.length - 1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentMarker) return;
    // If more than 2 seconds into current marker, seek to start of current marker; otherwise previous
    if (playbackPosition - currentMarker.startTime > 2 && currentMarkerIndex >= 0) {
      seekTo(currentMarker.startTime);
    } else if (hasPrev) {
      seekToMarker(currentMarkerIndex - 1);
    } else {
      seekTo(currentMarker.startTime);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNext) {
      seekToMarker(currentMarkerIndex + 1);
    }
  };

  const [isMushafOpen, setIsMushafOpen] = useState(false);

  return (
    <div className="w-full flex flex-col items-center justify-center my-2.5 relative z-40">
      <div ref={dropdownRef} className="relative inline-flex flex-col items-center max-w-full">
        {/* Row containing Bounding Box and Outside Book Button */}
        <div className="flex items-center gap-2 max-w-full">
          {/* Prominent Marker Card / Pill with Steppers (Bounding Box) */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-surface-subtle/80 hover:bg-surface-subtle border border-surface-border/90 shadow-md backdrop-blur-md transition-all">
            {/* Previous Ayah Button */}
            <button
              type="button"
              onClick={handlePrev}
              disabled={!hasPrev && (!currentMarker || playbackPosition - currentMarker.startTime <= 1)}
              title={hasPrev ? `Previous: ${currentMarkers[currentMarkerIndex - 1]?.title}` : "Start of Ayah"}
              aria-label="Previous Ayah marker"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-content-muted hover:text-content-primary hover:bg-surface-hover active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Central Prominent Marker Indicator / Trigger (Book icon removed) */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              title="Click to choose an Ayah from this Juz"
              className="flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl hover:bg-surface-hover/70 transition-all cursor-pointer group select-none max-w-[calc(100vw-8rem)] sm:max-w-md"
            >
              {/* Ayah Title & Index Badge */}
              <div className="flex items-center gap-1.5 min-w-0 text-left">
                {currentMarker ? (
                  <>
                    <span className="font-bold text-xs sm:text-sm text-content-primary truncate tracking-tight">
                      {currentMarker.surahName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary font-mono font-bold text-[11px] sm:text-xs border border-brand-primary/20 shrink-0">
                      {currentMarker.surahNumber}:{currentMarker.ayahNumber}
                    </span>
                  </>
                ) : (
                  <span className="font-medium text-xs text-content-muted">
                    Loading Ayah...
                  </span>
                )}

                {/* Ayah tally in Juz (e.g. 1/148) */}
                {currentMarkerIndex >= 0 && (
                  <span className="text-[10px] font-medium text-content-muted hidden sm:inline-block ml-0.5 shrink-0">
                    ({currentMarkerIndex + 1}/{currentMarkers.length})
                  </span>
                )}
              </div>

              {/* Dropdown Chevron */}
              <ChevronDown
                className={`w-3.5 h-3.5 text-content-muted group-hover:text-content-primary transition-transform duration-200 shrink-0 ${
                  isOpen ? "rotate-180 text-brand-primary" : ""
                }`}
              />
            </button>

            {/* Next Ayah Button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={!hasNext}
              title={hasNext ? `Next: ${currentMarkers[currentMarkerIndex + 1]?.title}` : "End of Juz"}
              aria-label="Next Ayah marker"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-content-muted hover:text-content-primary hover:bg-surface-hover active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Book Icon Button outside bounding box, to the right */}
          <button
            type="button"
            onClick={() => setIsMushafOpen(true)}
            title="Open Mushaf & English Translation"
            aria-label="Open Mushaf & English Translation"
            className="w-10 h-10 rounded-2xl bg-surface-subtle/80 hover:bg-surface-hover border border-surface-border/90 text-brand-primary shadow-md backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 group relative"
          >
            <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-110 transition-transform" />
            {isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand-primary animate-ping" />
            )}
          </button>
        </div>

        {/* Mushaf Popup Modal */}
        <MushafModal
          isOpen={isMushafOpen}
          onClose={() => setIsMushafOpen(false)}
          onOpenSettings={() => {
            window.dispatchEvent(
              new CustomEvent("open-settings", { detail: { tab: "mushaf" } })
            );
          }}
        />

        {/* Interactive Ayah Picker Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop for click outside */}
            <div
              className="fixed inset-0 z-40 bg-black/25 sm:bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <div
              className="absolute top-full mt-2 z-50 w-[min(22rem,calc(100vw-2rem))] sm:w-88 bg-surface-card border border-surface-border rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
              style={{
                left: "50%",
                transform: "translateX(-50%)",
                translate: "-50% 0",
              }}
            >
              {/* Header with Search Input */}
              <div className="p-2.5 border-b border-surface-border bg-surface-subtle/50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-content-muted px-1">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Select Ayah ({currentMarkers.length} in this Juz)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-surface-hover text-content-muted hover:text-content-primary transition cursor-pointer"
                    title="Close"
                    aria-label="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Ayah number or Surah name..."
                    className="w-full bg-surface-base border border-surface-border rounded-xl pl-8 pr-7 py-1.5 text-xs text-content-primary placeholder:text-content-muted/60 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-content-muted hover:text-content-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Ayah List */}
              <div
                ref={listRef}
                className="h-[280px] overflow-y-auto scrollbar-thin p-1.5 flex flex-col gap-0.5"
                role="listbox"
              >
                {filteredMarkers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-content-muted">
                    No Ayah found matching &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  filteredMarkers.map((marker, idx) => {
                    const isCurrent = Boolean(
                      currentMarker &&
                      currentMarker.surahNumber === marker.surahNumber &&
                      currentMarker.ayahNumber === marker.ayahNumber
                    );

                    return (
                      <button
                        key={`${marker.surahNumber}_${marker.ayahNumber}_${idx}`}
                        type="button"
                        onClick={() => {
                          const originalIdx = currentMarkers.findIndex(
                            (m) =>
                              m.surahNumber === marker.surahNumber &&
                              m.ayahNumber === marker.ayahNumber
                          );
                          if (originalIdx !== -1) {
                            seekToMarker(originalIdx);
                          } else {
                            seekTo(marker.startTime);
                          }
                          setIsOpen(false);
                        }}
                        className={`w-full h-10 shrink-0 text-left px-2.5 py-1 rounded-xl flex items-center justify-between gap-2 transition cursor-pointer ${
                          isCurrent
                            ? "bg-brand-primary text-white font-semibold shadow-sm"
                            : "hover:bg-surface-subtle active:bg-surface-subtle/80 text-content-secondary hover:text-content-primary"
                        }`}
                        role="option"
                        aria-selected={isCurrent}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Ayah Badge */}
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                              isCurrent
                                ? "bg-white/20 text-white"
                                : "bg-surface-subtle text-content-muted border border-surface-border"
                            }`}
                          >
                            {marker.ayahNumber}
                          </span>

                          {/* Title */}
                          <span className="text-xs truncate">
                            {marker.title}
                          </span>
                        </div>

                        {/* Right: Timestamp & Status */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCurrent ? (
                            <span className="text-[9px] bg-white/25 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              Playing
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-content-muted">
                              {formatAudioTime(marker.startTime)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

