"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import { formatAudioTime } from "../lib/utils";
import { Play, Volume2, ListMusic, Download } from "lucide-react";

export const JuzListTable: React.FC = () => {
  const {
    juzList,
    currentJuzId,
    isPlaying,
    selectJuz,
  } = useApp();

  return (
    <section className="w-full bg-surface-card border border-surface-border rounded-3xl p-5 sm:p-7 backdrop-blur-xl shadow-xl space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-brand-light text-brand-primary">
            <ListMusic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-content-primary">The 30 Juz Playlist</h2>
            <p className="text-xs text-content-muted">
              Complete Surah breakdown from Juz 1 to Juz 30
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-brand-primary bg-brand-light px-2.5 py-1 rounded-full border border-brand-primary/20">
          30 Total Tracks
        </span>
      </div>

      {/* List of 30 Juzs (Requirement 1.1 & 6) */}
      <div className="divide-y divide-surface-border max-h-[500px] overflow-y-auto pr-1">
        {juzList.map((item) => {
          const isCurrent = item.id === currentJuzId;
          const name = item.customName || item.defaultName;
          const range = item.customRange || item.defaultRange;

          return (
            <div
              key={item.id}
              className={`py-3 px-3 sm:px-4 rounded-2xl flex items-center justify-between gap-3 transition ${
                isCurrent
                  ? "bg-brand-light/50 border border-brand-primary/30 text-content-primary"
                  : "hover:bg-surface-subtle text-content-secondary"
              }`}
            >
              {/* Left: Juz Number & Surah Range */}
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition ${
                    isCurrent
                      ? "bg-brand-primary text-white shadow-md"
                      : "bg-surface-subtle text-content-muted"
                  }`}
                >
                  {item.id}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm sm:text-base truncate text-content-primary">
                      {name}
                    </span>
                    {isCurrent && isPlaying && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary bg-brand-light px-2 py-0.5 rounded-full border border-brand-primary/30 animate-pulse">
                        <Volume2 className="w-3 h-3" />
                        Playing
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-content-muted truncate mt-0.5 font-medium">
                    {range}
                  </p>
                </div>
              </div>

              {/* Right: Approx Duration & Play Button */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-content-muted hidden sm:inline">
                  {formatAudioTime(item.approxDurationSeconds)}
                </span>

                {/* Download Button (Users can download from app) */}
                <a
                  href={item.localAudioUrl}
                  download={`${name.replace(/\s+/g, "_")}_MaherAlMuaiqly.webm`}
                  title={`Download ${name} Audio`}
                  className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary border border-surface-border transition flex items-center justify-center shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => selectJuz(item.id)}
                  title={isCurrent ? "Currently Loaded" : `Play ${name}`}
                  className={`p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                    isCurrent
                      ? "bg-brand-primary text-white shadow-md font-bold"
                      : "bg-surface-subtle hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border"
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="hidden sm:inline">
                    {isCurrent ? "Active" : "Play"}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
