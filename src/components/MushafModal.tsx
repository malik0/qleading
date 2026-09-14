"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../context/AppContext";
import type { AyahMarker } from "../types/quran";
import {
  fetchVerseData,
  preloadVerses,
  getFontFamilyForOption,
  QuranVerseData,
  QURAN_TRANSLATIONS,
} from "../lib/quranApi";
import {
  X,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sliders,
  AlertCircle,
} from "lucide-react";

interface MushafModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

// Render the next Ayah slightly ahead of its spoken marker to absorb browser
// paint/layout latency. Keep this small enough that the display never feels
// perceptibly ahead of the recitation.
const MUSHAF_DISPLAY_LEAD_SECONDS = 0.08;

type TextRange = { start: number; end: number };

const FADED_TRANSLATION_REGEX =
  /\[[^\]]*\]|\([^)]*\)|--(?:(?!--)[^\n.!?])+?--|—[^—\n.!?]+?—|–[^–\n.!?]+?–|[⌜˹][^⌝˺]*[⌝˺]|[\[\]()⌜⌝˹˺]/g;

function findTextRanges(text: string, expression: RegExp): TextRange[] {
  const ranges: TextRange[] = [];
  const regex = new RegExp(expression.source, expression.flags);
  for (const match of text.matchAll(regex)) {
    if (match.index !== undefined) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
    }
  }
  return ranges;
}

function renderTranslationText(text: string): React.ReactNode[] {
  if (!text) return [];

  const fadedRanges = findTextRanges(text, FADED_TRANSLATION_REGEX);
  if (fadedRanges.length === 0) {
    return [<span key="0">{text}</span>];
  }

  const breakpoints = new Set<number>([0, text.length]);
  for (const range of fadedRanges) {
    breakpoints.add(range.start);
    breakpoints.add(range.end);
  }

  const points = [...breakpoints].sort((a, b) => a - b);
  return points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    const midpoint = start + (end - start) / 2;
    const isFaded = fadedRanges.some((range) => midpoint >= range.start && midpoint < range.end);

    return (
      <span
        key={`${start}-${end}`}
        className={isFaded ? "text-content-muted opacity-60 font-light select-text" : undefined}
      >
        {text.slice(start, end)}
      </span>
    );
  });
}

function getMarkerIndexAtTime(markers: AyahMarker[], position: number): number {
  let low = 0;
  let high = markers.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const marker = markers[mid];
    if (position < marker.startTime) {
      high = mid - 1;
    } else if (position >= marker.endTime) {
      low = mid + 1;
    } else {
      return mid;
    }
  }
  return Math.max(0, Math.min(markers.length - 1, high));
}

export const MushafModal: React.FC<MushafModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const {
    currentMarker,
    currentMarkers,
    currentMarkerIndex,
    audioRef,
    seekToMarker,
    isPlaying,
    isSyncing,
    togglePlay,
    settings,
    updateSettings,
  } = useApp();

  const [verseData, setVerseData] = useState<QuranVerseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayedMarkerIndex, setDisplayedMarkerIndex] = useState(currentMarkerIndex);
  const verseRequestRef = useRef(0);

  const translationId = settings.mushafTranslationId ?? 20;
  const scriptType = settings.mushafScript ?? "uthmani";
  const arabicFont = settings.mushafArabicFont ?? (scriptType === "indopak" ? "noto-nastaliq" : "amiri-quran");
  const arabicFontSize = settings.mushafArabicFontSize ?? 28;
  const translationFontSize = settings.mushafTranslationFontSize ?? 16;
  const displayedMarker = currentMarkers[displayedMarkerIndex] || currentMarker;

  // `timeupdate` is intentionally low-frequency. While the Mushaf is open,
  // sample the media clock per animation frame so the page changes with the
  // first rendered frame of its Ayah rather than the next timeupdate event.
  useEffect(() => {
    if (!isOpen || currentMarkers.length === 0) return;

    let frameId: number | null = null;
    const syncMarker = () => {
      const position = audioRef.current?.currentTime;
      const nextIndex =
        Number.isFinite(position) && position !== undefined
          ? getMarkerIndexAtTime(currentMarkers, position + MUSHAF_DISPLAY_LEAD_SECONDS)
          : currentMarkerIndex;
      setDisplayedMarkerIndex((previous) => (previous === nextIndex ? previous : nextIndex));
      if (isPlaying) frameId = window.requestAnimationFrame(syncMarker);
    };

    syncMarker();
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [audioRef, currentMarkerIndex, currentMarkers, isOpen, isPlaying]);

  // Load verse text whenever the displayed Ayah or translation changes.
  const loadVerse = useCallback(async () => {
    if (!displayedMarker) return;
    const requestId = ++verseRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      // Begin preloading before awaiting the displayed verse. This gives the
      // next Ayah its full current-Ayah duration to enter the cache.
      const targetsToPreload: Array<{ surahNumber: number; ayahNumber: number }> = [];
      if (displayedMarkerIndex < currentMarkers.length - 1) {
        const next1 = currentMarkers[displayedMarkerIndex + 1];
        targetsToPreload.push({ surahNumber: next1.surahNumber, ayahNumber: next1.ayahNumber });
      }
      if (displayedMarkerIndex < currentMarkers.length - 2) {
        const next2 = currentMarkers[displayedMarkerIndex + 2];
        targetsToPreload.push({ surahNumber: next2.surahNumber, ayahNumber: next2.ayahNumber });
      }
      if (displayedMarkerIndex > 0) {
        const prev1 = currentMarkers[displayedMarkerIndex - 1];
        targetsToPreload.push({ surahNumber: prev1.surahNumber, ayahNumber: prev1.ayahNumber });
      }
      if (targetsToPreload.length > 0) preloadVerses(targetsToPreload, translationId);

      const data = await fetchVerseData(
        displayedMarker.surahNumber,
        displayedMarker.ayahNumber,
        translationId
      );
      if (requestId === verseRequestRef.current) setVerseData(data);
    } catch (err: unknown) {
      console.error("Failed to load verse data:", err);
      if (requestId === verseRequestRef.current) {
        setError("Unable to load verse text. Please check your internet connection and try again.");
      }
    } finally {
      if (requestId === verseRequestRef.current) setLoading(false);
    }
  }, [currentMarkers, displayedMarker, displayedMarkerIndex, translationId]);

  useEffect(() => {
    if (isOpen) {
      loadVerse();
    }
  }, [isOpen, loadVerse]);

  // Translator cycling handlers (QL011)
  const currentTransIndex = Math.max(
    0,
    QURAN_TRANSLATIONS.findIndex((t) => t.id === translationId)
  );

  const handlePrevTranslation = () => {
    const prevIdx =
      currentTransIndex > 0 ? currentTransIndex - 1 : QURAN_TRANSLATIONS.length - 1;
    updateSettings({ mushafTranslationId: QURAN_TRANSLATIONS[prevIdx].id });
  };

  const handleNextTranslation = () => {
    const nextIdx =
      currentTransIndex < QURAN_TRANSLATIONS.length - 1 ? currentTransIndex + 1 : 0;
    updateSettings({ mushafTranslationId: QURAN_TRANSLATIONS[nextIdx].id });
  };

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

  if (!isOpen || !displayedMarker) return null;

  const hasPrev = displayedMarkerIndex > 0;
  const hasNext = displayedMarkerIndex < currentMarkers.length - 1;

  // Format verse number for Quran.com link, e.g. 114:03 or 12:05
  const formattedAyah = String(displayedMarker.ayahNumber).padStart(2, "0");
  const verseParam = `${displayedMarker.surahNumber}:${formattedAyah}`;
  const quranComUrl = `https://quran.com/${verseParam}`;

  // Select script text: IndoPak or Uthmani
  const arabicText =
    scriptType === "indopak"
      ? verseData?.textIndopak || verseData?.textUthmani
      : verseData?.textUthmani;

  const activeFontFamily = getFontFamilyForOption(arabicFont);
  const activeTranslation = QURAN_TRANSLATIONS.find((t) => t.id === translationId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mushaf-modal-title"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative z-10 bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200 animate-slideUp">
        {/* Header (Book icon, Ayah location text, and subtitle removed per QL012, QL013, QL014) */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-surface-border bg-surface-subtle/40 shrink-0">
          {/* Left: Title & Ayah Badge */}
          <div className="flex items-center gap-2 flex-wrap min-w-0 pr-2">
            <h3
              id="mushaf-modal-title"
              className="text-base sm:text-lg font-bold text-content-primary truncate"
            >
              {displayedMarker.surahName}
            </h3>
            <span className="px-2.5 py-0.5 rounded-md bg-brand-primary/10 text-brand-primary font-mono font-bold text-xs border border-brand-primary/20 shrink-0">
              {displayedMarker.surahNumber}:{displayedMarker.ayahNumber}
            </span>
          </div>

          {/* Right: Actions (Settings, Close) - Quran.com link moved to bottom per QL009 */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Quick Settings Shortcut */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                title="Mushaf Typography & Translation Settings"
                aria-label="Mushaf Settings"
                className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-secondary hover:text-content-primary transition cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title="Close Mushaf"
              aria-label="Close"
              className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-7 overflow-y-auto flex-1 min-h-0 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-content-muted">
              <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
              <p className="text-xs font-medium">Loading Arabic script &amp; translation...</p>
            </div>
          ) : error ? (
            <div className="py-10 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{error}</p>
              <button
                type="button"
                onClick={loadVerse}
                className="px-4 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-semibold shadow-sm hover:brightness-110 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Arabic Quranic Script (Horizontal rule and Script/Font info removed per QL015) */}
              <div className="p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-surface-subtle/50 border border-surface-border/80 shadow-inner transition-colors duration-200">
                <div
                  dir="rtl"
                  lang="ar"
                  className="quran-arabic-text text-content-primary select-text transition-all leading-relaxed"
                  style={{
                    fontFamily: activeFontFamily,
                    fontSize: `${arabicFontSize}px`,
                    lineHeight: scriptType === "indopak" ? 2.5 : 2.2,
                  }}
                >
                  {arabicText}
                  <span
                    className="inline-flex items-center justify-center mx-2 select-none align-middle font-mono font-bold text-brand-primary text-sm opacity-90"
                    title={`Ayah ${displayedMarker.ayahNumber}`}
                  >
                    ﴿{displayedMarker.ayahNumber}﴾
                  </span>
                </div>
              </div>

              {/* Translation Content (English Translation label removed per QL010) */}
              <div className="space-y-4 px-1">
                <div
                  className="text-content-secondary leading-relaxed select-text font-normal transition-all"
                  style={{ fontSize: `${translationFontSize}px` }}
                >
                  {renderTranslationText(verseData?.translationText || "No translation text available.")}
                </div>

                {/* Translator Selector Box with Left/Right Arrows (QL011) */}
                <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-surface-subtle/80 border border-surface-border shadow-xs">
                  <button
                    type="button"
                    onClick={handlePrevTranslation}
                    title="Previous translator"
                    aria-label="Previous translator"
                    className="p-1.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="text-center px-2 min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-content-primary truncate block">
                      {activeTranslation ? activeTranslation.name : "Saheeh International"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextTranslation}
                    title="Next translator"
                    aria-label="Next translator"
                    className="p-1.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Quran.com Link (QL009: Moved to bottom of popup, underneath English translation & translator) */}
                <div className="flex justify-center pt-1 pb-1">
                  <a
                    href={quranComUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${verseParam} on Quran.com`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-light hover:bg-brand-primary hover:text-white text-brand-primary font-medium text-xs border border-brand-primary/20 transition shadow-xs cursor-pointer group"
                  >
                    <span className="font-mono font-semibold">Quran.com/{verseParam}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Replicated Playback Controls & Navigation */}
        <div className="p-3 sm:p-4 bg-surface-subtle/60 border-t border-surface-border flex items-center justify-between gap-2 shrink-0">
          {/* Previous Ayah Button */}
          <button
            type="button"
            onClick={() => hasPrev && seekToMarker(displayedMarkerIndex - 1)}
            disabled={!hasPrev}
            title={hasPrev ? `Previous: ${currentMarkers[displayedMarkerIndex - 1]?.title}` : "First Ayah of Juz"}
            aria-label="Previous Ayah"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-xs font-semibold text-content-secondary hover:text-content-primary disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Prev Ayah</span>
          </button>

          {/* Replicated Hero Play/Pause Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={isSyncing}
              title={isSyncing ? "Syncing..." : isPlaying ? "Pause Audio" : "Play Audio"}
              aria-label={isPlaying ? "Pause Audio" : "Play Audio"}
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-glow))",
                boxShadow: "0 8px 20px -4px var(--color-primary-glow)",
              }}
              className={`px-5 sm:px-6 py-2.5 rounded-2xl text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition duration-200 active:scale-95 hover:brightness-110 cursor-pointer shadow-md ${
                isSyncing ? "opacity-80 cursor-wait" : ""
              }`}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current translate-x-0.2" />
              )}
              <span>{isPlaying ? "Pause Recitation" : "Play Recitation"}</span>
            </button>
          </div>

          {/* Next Ayah Button */}
          <button
            type="button"
            onClick={() => hasNext && seekToMarker(displayedMarkerIndex + 1)}
            disabled={!hasNext}
            title={hasNext ? `Next: ${currentMarkers[displayedMarkerIndex + 1]?.title}` : "End of Juz"}
            aria-label="Next Ayah"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-xs font-semibold text-content-secondary hover:text-content-primary disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shrink-0"
          >
            <span className="hidden sm:inline">Next Ayah</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
