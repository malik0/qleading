"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import { formatAudioTime, formatHeroTimer, formatRelativeTime, formatDateTime } from "../lib/utils";
import {
  History,
  RotateCcw,
  Undo2,
  X,
  AlertTriangle,
  Clock,
  BookmarkPlus,
  Radio,
} from "lucide-react";
import type { SyncPoint } from "../types/quran";
import { getAyahMarkerForPosition } from "../lib/juzMarkers";

function formatJuzName(juzId: number, customName?: string, defaultName?: string): string {
  const name = (customName || defaultName || "").trim();
  if (!name || name.toLowerCase() === `juz ${juzId}`.toLowerCase()) {
    return `Juz ${juzId}`;
  }
  if (name.toLowerCase().startsWith(`juz ${juzId}`.toLowerCase())) {
    return name;
  }
  return `Juz ${juzId} (${name})`;
}

interface RollBackContentProps {
  onRollbackComplete?: () => void;
}

export const RollBackContent: React.FC<RollBackContentProps> = ({ onRollbackComplete }) => {
  const {
    syncPoints,
    saveSyncPoint,
    rollbackToSyncPoint,
    rollbackToAccidentFifteenSeconds,
    lastAccident,
    isLastSyncPointOlderThan1Min,
    currentJuz,
    playbackPosition,
    timerSeconds,
  } = useApp();

  const handleRollbackPoint = (sp: SyncPoint) => {
    rollbackToSyncPoint(sp);
    if (onRollbackComplete) {
      onRollbackComplete();
    }
  };

  const handleRollbackAccident = () => {
    rollbackToAccidentFifteenSeconds();
    if (onRollbackComplete) {
      onRollbackComplete();
    }
  };

  // Determine accident target state for display
  const targetAccidentState = lastAccident?.fifteenSecBeforeState || {
    juzId: currentJuz.id,
    juzName: currentJuz.customName || currentJuz.defaultName,
    playbackPositionSeconds: Math.max(0, playbackPosition - 15),
    timerSeconds: timerSeconds + 15,
  };

  const accidentMarker =
    targetAccidentState.surahNumber && targetAccidentState.ayahNumber && targetAccidentState.surahName
      ? {
          surahNumber: targetAccidentState.surahNumber,
          ayahNumber: targetAccidentState.ayahNumber,
          surahName: targetAccidentState.surahName,
        }
      : getAyahMarkerForPosition(
          targetAccidentState.juzId,
          targetAccidentState.playbackPositionSeconds
        );

  return (
    <div className="space-y-4">
      {/* 1. 15-SECOND ACCIDENT ROLLBACK OPTION (Visible when last synch point is > 1 min earlier) */}
      {isLastSyncPointOlderThan1Min && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              15-Second Accident Rollback Option
            </span>
            <span className="text-[10px] font-medium bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
              {syncPoints.length === 0 ? "No prior synch point" : "Last synch point > 1 min earlier"}
            </span>
          </div>

          <p className="text-content-secondary text-[11px] leading-relaxed">
            The last recorded synch point was saved more than 1 minute ago. You can roll back directly to{" "}
            <strong>15 seconds before the accident</strong> to restore your Big Timer and reading position without losing your recent listening progress.
          </p>

          {/* Accident State Summary */}
          <div className="p-3 rounded-xl bg-surface-card/70 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-content-muted">Accident Reference:</span>
              <span className="font-semibold text-content-primary">
                {lastAccident?.description || "Recent Action / Scrubber Jump"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] gap-1">
              <span className="text-content-muted shrink-0">Restores Position To:</span>
              <span className="font-semibold text-brand-primary flex flex-wrap items-center sm:justify-end gap-1.5">
                <span>{formatJuzName(targetAccidentState.juzId, targetAccidentState.juzName)}</span>
                {accidentMarker && (
                  <>
                    <span className="text-content-muted font-normal">•</span>
                    <span>
                      Surah {accidentMarker.surahNumber} ({accidentMarker.surahName}), Verse {accidentMarker.ayahNumber}
                    </span>
                  </>
                )}
                <span className="font-mono text-content-secondary font-normal">
                  at {formatAudioTime(targetAccidentState.playbackPositionSeconds)}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-content-muted">Restores Big Timer To:</span>
              <span className="font-semibold font-mono text-emerald-500">
                {formatHeroTimer(targetAccidentState.timerSeconds)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRollbackAccident}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md transition active:scale-98"
          >
            <Undo2 className="w-4 h-4" />
            Roll Back (-15s Before Accident)
          </button>
        </div>
      )}

      {/* 2. HEADER BAR & SAVE CURRENT POINT BUTTON */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="text-xs text-content-muted flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-brand-primary" />
          <span>{syncPoints.length} saved synch point{syncPoints.length === 1 ? "" : "s"}</span>
        </div>

        <button
          type="button"
          onClick={() => saveSyncPoint("Manual Checkpoint")}
          className="flex items-center gap-1.5 text-xs text-brand-primary hover:text-brand-hover bg-brand-light/50 hover:bg-brand-light px-3 py-1.5 rounded-xl border border-brand-primary/20 transition font-semibold shadow-sm"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>Save Current Point</span>
        </button>
      </div>

      {/* 3. LIST OF SAVED SYNCH POINTS */}
      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
        {syncPoints.length === 0 ? (
          <div className="text-center py-8 text-content-muted text-xs space-y-2 bg-surface-subtle/50 rounded-2xl border border-surface-border p-6">
            <Radio className="w-8 h-8 mx-auto text-content-muted/50 animate-pulse" />
            <p className="font-medium text-content-secondary">No synch points recorded yet</p>
            <p className="text-[11px]">
              Synch points are automatically saved as you play, pause, change tracks, or sync with the cloud.
            </p>
          </div>
        ) : (
          syncPoints.map((sp, idx) => {
            const spMarker =
              sp.surahNumber && sp.ayahNumber && sp.surahName
                ? { surahNumber: sp.surahNumber, ayahNumber: sp.ayahNumber, surahName: sp.surahName }
                : getAyahMarkerForPosition(sp.juzId, sp.playbackPositionSeconds);

            return (
              <div
                key={sp.id || idx}
                className="p-3.5 rounded-2xl bg-surface-subtle hover:bg-surface-hover border border-surface-border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm group"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  {/* Badge and Timestamps */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                      {sp.label || "Synch Point"}
                    </span>
                    <span className="text-xs font-mono font-medium text-content-primary">
                      {formatDateTime(sp.timestamp)}
                    </span>
                    <span className="text-[10px] text-content-muted">
                      ({formatRelativeTime(sp.timestamp)})
                    </span>
                  </div>

                  {/* Values: Position and Big Timer */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-content-secondary pt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-content-muted text-[11px] shrink-0">Position:</span>
                      <span className="font-semibold text-content-primary">
                        {formatJuzName(sp.juzId, sp.juzName)}
                      </span>
                      {spMarker && (
                        <>
                          <span className="text-content-muted font-normal">•</span>
                          <span className="font-semibold text-brand-primary">
                            Surah {spMarker.surahNumber} ({spMarker.surahName}), Verse {spMarker.ayahNumber}
                          </span>
                        </>
                      )}
                      <span className="text-content-muted font-mono text-[11px]">
                        ({formatAudioTime(sp.playbackPositionSeconds)}
                        {sp.audioDurationSeconds ? ` / ${formatAudioTime(sp.audioDurationSeconds)}` : ""})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-content-muted text-[11px]">Big Timer:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatHeroTimer(sp.timerSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Roll Back action button */}
                <button
                  type="button"
                  onClick={() => handleRollbackPoint(sp)}
                  title="Roll back to this synch point"
                  className="shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-card hover:bg-brand-primary hover:text-white border border-surface-border hover:border-brand-primary text-xs font-semibold text-content-secondary transition shadow-sm active:scale-95 group-hover:border-brand-primary/40"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Roll Back</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

interface RollBackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RollBackModal: React.FC<RollBackModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-surface-card border border-surface-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-border bg-surface-subtle/50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center text-brand-primary">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-content-primary flex items-center gap-1.5">
                Roll Back & Synch Points
              </h3>
              <p className="text-xs text-content-muted">
                Revert to saved checkpoints or restore progress after accidents
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-surface-hover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          <RollBackContent onRollbackComplete={onClose} />
        </div>
      </div>
    </div>
  );
};
