"use client";

import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { formatAudioTime } from "../lib/utils";
import { Download, CheckCircle, RefreshCw, X, HardDrive } from "lucide-react";

export const MediaDownloadsList: React.FC = () => {
  const { juzList } = useApp();

  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  } | null>(null);
  const [completedAll, setCompletedAll] = useState(false);

  const abortRef = useRef(false);

  const handleDownloadAll = async () => {
    if (isDownloadingAll) return;
    setIsDownloadingAll(true);
    setCompletedAll(false);
    abortRef.current = false;

    for (let i = 0; i < juzList.length; i++) {
      if (abortRef.current) break;

      const item = juzList[i];
      const name = item.customName || item.defaultName;
      setDownloadProgress({
        current: i + 1,
        total: juzList.length,
        currentName: name,
      });

      // Trigger download via anchor
      const a = document.createElement("a");
      a.href = item.localAudioUrl;
      a.download = `${name.replace(/\s+/g, "_")}_SaudAlShuraim.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Pacing interval to prevent browser popup blockers from suppressing sequential downloads
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setIsDownloadingAll(false);
    setDownloadProgress(null);
    if (!abortRef.current) {
      setCompletedAll(true);
      setTimeout(() => setCompletedAll(false), 6000);
    }
  };

  const handleCancelDownload = () => {
    abortRef.current = true;
    setIsDownloadingAll(false);
    setDownloadProgress(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Download All Control */}
      <div className="bg-surface-subtle/70 border border-surface-border rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-light text-brand-primary shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-content-primary">
                Media downloads
              </h4>
              <p className="text-xs text-content-muted">
                Download complete 30 Juz audio recitation by Sheikh Saud Al-Shuraim
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono text-brand-primary bg-brand-light px-2.5 py-1 rounded-full border border-brand-primary/20">
              30 Tracks
            </span>

            {/* Download All Button */}
            {!isDownloadingAll ? (
              <button
                type="button"
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-brand-primary hover:bg-brand-hover text-white shadow-md transition active:scale-95 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancelDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-500 border border-rose-500/30 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Download Progress Bar */}
        {isDownloadingAll && downloadProgress && (
          <div className="pt-2 border-t border-surface-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-content-primary flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-primary" />
                Downloading: {downloadProgress.currentName}
              </span>
              <span className="font-mono text-content-muted">
                {downloadProgress.current} / {downloadProgress.total} (
                {Math.round(
                  (downloadProgress.current / downloadProgress.total) * 100
                )}
                %)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-hover overflow-hidden">
              <div
                className="h-full bg-brand-primary transition-all duration-300 rounded-full"
                style={{
                  width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-content-muted italic">
              Note: If prompted by your browser to &ldquo;Allow automatic downloads&rdquo;, please click Allow.
            </p>
          </div>
        )}

        {completedAll && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>All 30 Juz downloads have been initiated successfully!</span>
          </div>
        )}
      </div>

      {/* Replicated 30 Juz Playlist (Play Option Removed) */}
      <div className="divide-y divide-surface-border max-h-[420px] overflow-y-auto pr-1 rounded-2xl border border-surface-border bg-surface-card/60">
        {juzList.map((item) => {
          const name = item.customName || item.defaultName;
          const range = item.customRange || item.defaultRange;

          return (
            <div
              key={item.id}
              className="py-3 px-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-surface-subtle transition"
            >
              {/* Left: Juz Number & Surah Range */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 bg-surface-subtle text-content-muted border border-surface-border">
                  {item.id}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm sm:text-base truncate text-content-primary">
                      {name}
                    </span>
                  </div>
                  <p className="text-xs text-content-muted truncate mt-0.5 font-medium">
                    {range}
                  </p>
                </div>
              </div>

              {/* Right: Approx Duration & Download Button (No Play Option) */}
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-xs font-mono text-content-muted hidden sm:inline">
                  {formatAudioTime(item.approxDurationSeconds)}
                </span>

                <a
                  href={item.localAudioUrl}
                  download={`${name.replace(/\s+/g, "_")}_SaudAlShuraim.webm`}
                  title={`Download ${name} Audio`}
                  className="px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border transition flex items-center gap-1.5 text-xs font-semibold shadow-xs active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-brand-primary" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

