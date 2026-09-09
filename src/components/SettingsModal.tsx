"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { DayOfWeek, PlaybackSpeed, ThemeColor, ThemeMode, TimerMode } from "../types/quran";
import {
  X,
  Sliders,
  Clock,
  RotateCcw,
  Calendar,
  Volume2,
  Check,
  Palette,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  Play,
  Gauge,
  Download,
  Flame,
  Trophy,
  CheckCircle2,
  ListChecks,
  Minus,
  Plus,
} from "lucide-react";
import { MediaDownloadsList } from "./MediaDownloadsList";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ThemeCategory = "all" | "quranic" | "modern" | "contrast";

interface ThemeOption {
  id: ThemeColor;
  name: string;
  category: "quranic" | "modern" | "contrast";
  badge: string;
  desc: string;
  lightHex: string;
  darkHex: string;
  lightBgHex: string;
  darkBgHex: string;
  lightCardHex: string;
  darkCardHex: string;
}

const COLOR_OPTIONS: ThemeOption[] = [
  {
    id: "emerald",
    name: "Madinah Emerald",
    category: "quranic",
    badge: "Sacred Islamic",
    desc: "Serene forest green inspired by the Prophet's Mosque dome",
    lightHex: "#059669",
    darkHex: "#10b981",
    lightBgHex: "#f0fdf4",
    darkBgHex: "#021a12",
    lightCardHex: "#ffffff",
    darkCardHex: "#062820",
  },
  {
    id: "sepia",
    name: "Sepia Manuscript",
    category: "quranic",
    badge: "Quran Parchment",
    desc: "Warm parchment paper & bronze leather, classic for Mushaf reading",
    lightHex: "#925828",
    darkHex: "#d49553",
    lightBgHex: "#fbf7ee",
    darkBgHex: "#14110d",
    lightCardHex: "#f5efe1",
    darkCardHex: "#1f1a14",
  },
  {
    id: "amber",
    name: "Desert Amber",
    category: "quranic",
    badge: "Warm Sunrise",
    desc: "Warm golden sands and desert dawn contemplation",
    lightHex: "#d97706",
    darkHex: "#fbbf24",
    lightBgHex: "#fffbeb",
    darkBgHex: "#141008",
    lightCardHex: "#ffffff",
    darkCardHex: "#211b0e",
  },
  {
    id: "olive",
    name: "Olive Grove",
    category: "quranic",
    badge: "Blessed Fig & Olive",
    desc: "Earth-toned natural sage and soothing olive greens",
    lightHex: "#65a30d",
    darkHex: "#a3e635",
    lightBgHex: "#f7f8f2",
    darkBgHex: "#10140c",
    lightCardHex: "#ffffff",
    darkCardHex: "#1a2014",
  },
  {
    id: "sky",
    name: "Celestial Sky",
    category: "modern",
    badge: "Modern Default",
    desc: "Crisp cyan & deep twilight navy for maximum clarity",
    lightHex: "#0284c7",
    darkHex: "#38bdf8",
    lightBgHex: "#f8fafc",
    darkBgHex: "#020617",
    lightCardHex: "#ffffff",
    darkCardHex: "#0f172a",
  },
  {
    id: "indigo",
    name: "Royal Indigo",
    category: "modern",
    badge: "Deep Night",
    desc: "Contemplative midnight blue-violet for late-night recitation",
    lightHex: "#4f46e5",
    darkHex: "#818cf8",
    lightBgHex: "#f5f6ff",
    darkBgHex: "#060818",
    lightCardHex: "#ffffff",
    darkCardHex: "#0e122b",
  },
  {
    id: "teal",
    name: "Teal Oasis",
    category: "modern",
    badge: "Ocean Turquoise",
    desc: "Refreshing oceanic turquoise with soothing balance",
    lightHex: "#0d9488",
    darkHex: "#2dd4bf",
    lightBgHex: "#f0fdfa",
    darkBgHex: "#021614",
    lightCardHex: "#ffffff",
    darkCardHex: "#072522",
  },
  {
    id: "purple",
    name: "Spiritual Amethyst",
    category: "modern",
    badge: "Spiritual Violet",
    desc: "Vibrant royal violet with meditative elegance",
    lightHex: "#9333ea",
    darkHex: "#c084fc",
    lightBgHex: "#faf5ff",
    darkBgHex: "#12061e",
    lightCardHex: "#ffffff",
    darkCardHex: "#1d0c2e",
  },
  {
    id: "rose",
    name: "Rose Ruby",
    category: "modern",
    badge: "Crimson Velvet",
    desc: "Rich crimson with gentle blush accents",
    lightHex: "#e11d48",
    darkHex: "#fb7185",
    lightBgHex: "#fff1f2",
    darkBgHex: "#17050a",
    lightCardHex: "#ffffff",
    darkCardHex: "#250a12",
  },
  {
    id: "coral",
    name: "Sunset Coral",
    category: "modern",
    badge: "Terracotta Warmth",
    desc: "Warm terracotta peach glowing with evening warmth",
    lightHex: "#ea580c",
    darkHex: "#fb923c",
    lightBgHex: "#fff7ed",
    darkBgHex: "#180a04",
    lightCardHex: "#ffffff",
    darkCardHex: "#271309",
  },
  {
    id: "oled",
    name: "Midnight Obsidian",
    category: "contrast",
    badge: "True-Black OLED",
    desc: "Pure #000000 black for OLED screens & maximum battery savings",
    lightHex: "#0284c7",
    darkHex: "#38bdf8",
    lightBgHex: "#ffffff",
    darkBgHex: "#000000",
    lightCardHex: "#f8fafc",
    darkCardHex: "#0a0a0d",
  },
  {
    id: "slate",
    name: "Minimalist Slate",
    category: "contrast",
    badge: "Monochrome",
    desc: "Distraction-free neutral grayscale and understated tones",
    lightHex: "#475569",
    darkHex: "#94a3b8",
    lightBgHex: "#f8fafc",
    darkBgHex: "#090d16",
    lightCardHex: "#ffffff",
    darkCardHex: "#121826",
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    settings,
    updateSettings,
    juzList,
    themeMode,
    themeColor,
    resolvedTheme,
    setThemeMode,
    setThemeColor,
    completedJuzs,
    juzTally,
    setJuzTallyManually,
    setCompletedStreakDaysManually,
    historyRecords,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    "themes" | "general" | "progress" | "juz" | "media"
  >("themes");
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategory>("all");

  // Local state for Juz editor
  const [selectedJuzEdit, setSelectedJuzEdit] = useState<number>(1);
  const [customNameInput, setCustomNameInput] = useState<string>("");
  const [customRangeInput, setCustomRangeInput] = useState<string>("");

  // Local state for Manual Tally and Streak adjustments
  const [manualTallyInput, setManualTallyInput] = useState<number>(juzTally || 0);
  const [manualCompletedJuzs, setManualCompletedJuzs] = useState<number[]>(completedJuzs || []);
  const [manualStreakDays, setManualStreakDays] = useState<number>(() => {
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toLocaleDateString("en-CA"); // YYYY-MM-DD
      const r = historyRecords[ds];
      if (r && (r.targetReached || (r.juzCompletedCount && r.juzCompletedCount > 0))) {
        count++;
      }
    }
    return count;
  });
  const [progressSaveNotice, setProgressSaveNotice] = useState<string | null>(null);

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setManualTallyInput(juzTally || 0);
      setManualCompletedJuzs(completedJuzs || []);
      let count = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const ds = d.toLocaleDateString("en-CA");
        const r = historyRecords[ds];
        if (r && (r.targetReached || (r.juzCompletedCount && r.juzCompletedCount > 0))) {
          count++;
        }
      }
      setManualStreakDays(count);
      setProgressSaveNotice(null);
    }
  }, [isOpen, juzTally, completedJuzs, historyRecords]);

  if (!isOpen) return null;

  const currentEditJuz = juzList.find((j) => j.id === selectedJuzEdit) || juzList[0];

  const handleSelectJuzToEdit = (id: number) => {
    setSelectedJuzEdit(id);
    const j = juzList.find((item) => item.id === id);
    setCustomNameInput(settings.customJuzNames[id] || j?.defaultName || "");
    setCustomRangeInput(settings.customJuzRanges[id] || j?.defaultRange || "");
  };

  const handleSaveJuzCustomization = () => {
    updateSettings({
      customJuzNames: {
        ...settings.customJuzNames,
        [selectedJuzEdit]: customNameInput.trim(),
      },
      customJuzRanges: {
        ...settings.customJuzRanges,
        [selectedJuzEdit]: customRangeInput.trim(),
      },
    });
  };

  const handleResetJuzToDefault = () => {
    const nextNames = { ...settings.customJuzNames };
    const nextRanges = { ...settings.customJuzRanges };
    delete nextNames[selectedJuzEdit];
    delete nextRanges[selectedJuzEdit];
    updateSettings({
      customJuzNames: nextNames,
      customJuzRanges: nextRanges,
    });
    setCustomNameInput(currentEditJuz.defaultName);
    setCustomRangeInput(currentEditJuz.defaultRange);
  };

  const filteredThemes = COLOR_OPTIONS.filter((th) => {
    if (selectedCategory === "all") return true;
    return th.category === selectedCategory;
  });

  const activeThemeObj =
    COLOR_OPTIONS.find((t) => t.id === themeColor) || COLOR_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2 sm:p-2.5 rounded-xl bg-brand-light text-brand-primary shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-content-primary truncate sm:whitespace-normal">App Settings</h3>
              <p className="text-xs text-content-muted line-clamp-1 sm:line-clamp-none">
                Choose color themes, adjust display mode, audio jump steps, and Juz labels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="border-b border-surface-border px-3 sm:px-6 py-2.5 sm:py-3 bg-surface-subtle/40 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-max">
            <button
              onClick={() => setActiveTab("themes")}
              className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === "themes"
                  ? "bg-brand-primary text-white shadow-sm font-bold"
                  : "bg-surface-card hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Color Themes</span>
            </button>
            <button
              onClick={() => setActiveTab("general")}
              className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === "general"
                  ? "bg-brand-primary text-white shadow-sm font-bold"
                  : "bg-surface-card hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border"
              }`}
            >
              <span>General & Playback</span>
            </button>
            <button
              onClick={() => setActiveTab("progress")}
              className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === "progress"
                  ? "bg-brand-primary text-white shadow-sm font-bold"
                  : "bg-surface-card hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Tally & Streaks</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("juz");
                handleSelectJuzToEdit(selectedJuzEdit);
              }}
              className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === "juz"
                  ? "bg-brand-primary text-white shadow-sm font-bold"
                  : "bg-surface-card hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border"
              }`}
            >
              <span>Customize 30 Juzs</span>
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0 ${
                activeTab === "media"
                  ? "bg-brand-primary text-white shadow-sm font-bold"
                  : "bg-surface-card hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border"
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Media downloads</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 min-h-0">
          {/* TAB 1: COLOR THEMES GALLERY */}
          {activeTab === "themes" && (
            <div className="space-y-6">
              {/* Theme Mode Selector (Dark, Light, System) */}
              <div className="space-y-2.5">
                <label className="text-xs text-content-muted block font-semibold uppercase tracking-wider">
                  Display Mode
                </label>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  {/* Dark Mode Card */}
                  <button
                    type="button"
                    onClick={() => setThemeMode("dark")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition ${
                      themeMode === "dark"
                        ? "border-brand-primary bg-brand-light/30 shadow-md ring-1 ring-brand-primary"
                        : "border-surface-border bg-surface-subtle/50 hover:bg-surface-hover"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-content-primary block">
                        Dark Mode
                      </span>
                      <span className="text-[10px] text-content-muted hidden sm:block">
                        Night recitation
                      </span>
                    </div>
                  </button>

                  {/* Light Mode Card */}
                  <button
                    type="button"
                    onClick={() => setThemeMode("light")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition ${
                      themeMode === "light"
                        ? "border-brand-primary bg-brand-light/30 shadow-md ring-1 ring-brand-primary"
                        : "border-surface-border bg-surface-subtle/50 hover:bg-surface-hover"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-content-primary block">
                        Light Mode
                      </span>
                      <span className="text-[10px] text-content-muted hidden sm:block">
                        Crisp daytime
                      </span>
                    </div>
                  </button>

                  {/* System Mode Card */}
                  <button
                    type="button"
                    onClick={() => setThemeMode("system")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition ${
                      themeMode === "system"
                        ? "border-brand-primary bg-brand-light/30 shadow-md ring-1 ring-brand-primary"
                        : "border-surface-border bg-surface-subtle/50 hover:bg-surface-hover"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-center text-content-secondary">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-content-primary block">
                        System
                      </span>
                      <span className="text-[10px] text-content-muted hidden sm:block">
                        Auto match
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Color Themes Section */}
              <div className="space-y-3.5 pt-4 border-t border-surface-border">
                {/* Section Header with Active Theme Indicator */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-content-primary flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-primary" />
                      Color Themes
                    </h4>
                    <p className="text-xs text-content-muted">
                      Select a themed palette with tailored ambient surfaces & accents
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-light/40 border border-brand-primary/30 text-brand-primary text-xs font-semibold self-start sm:self-auto">
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-sm"
                      style={{
                        backgroundColor:
                          resolvedTheme === "dark"
                            ? activeThemeObj.darkHex
                            : activeThemeObj.lightHex,
                      }}
                    />
                    <span>Active: {activeThemeObj.name}</span>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { id: "all", label: "All Themes", count: COLOR_OPTIONS.length },
                    { id: "quranic", label: "Quranic & Classic", count: 4 },
                    { id: "modern", label: "Modern & Vibrant", count: 6 },
                    { id: "contrast", label: "Minimal & Contrast", count: 2 },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as ThemeCategory)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                        selectedCategory === cat.id
                          ? "bg-brand-primary text-white shadow-sm font-semibold"
                          : "bg-surface-subtle text-content-muted hover:text-content-primary hover:bg-surface-hover border border-surface-border"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          selectedCategory === cat.id
                            ? "bg-white/20 text-white"
                            : "bg-surface-hover text-content-muted"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Theme Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {filteredThemes.map((col) => {
                    const isSelected = themeColor === col.id;
                    const isDark = resolvedTheme === "dark";
                    const accent = isDark ? col.darkHex : col.lightHex;
                    const bg = isDark ? col.darkBgHex : col.lightBgHex;
                    const card = isDark ? col.darkCardHex : col.lightCardHex;

                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setThemeColor(col.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-3 group ${
                          isSelected
                            ? "border-brand-primary bg-brand-light/20 shadow-md ring-2 ring-brand-primary"
                            : "border-surface-border bg-surface-subtle/40 hover:bg-surface-hover/80 hover:border-surface-subtle"
                        }`}
                      >
                        {/* Top: Name, Badge & Selection Checkmark */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-content-primary">
                                {col.name}
                              </span>
                              {isSelected && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary bg-brand-light px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  Selected
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-medium text-brand-primary/90 mt-0.5 block">
                              {col.badge}
                            </span>
                          </div>

                          {/* Color Swatch Dots */}
                          <div className="flex items-center gap-1 shrink-0 p-1 rounded-lg bg-surface-card border border-surface-border shadow-xs">
                            <span
                              className="w-3 h-3 rounded-full border border-black/15 shadow-xs"
                              style={{ backgroundColor: bg }}
                              title="Background tone"
                            />
                            <span
                              className="w-3 h-3 rounded-full border border-black/15 shadow-xs"
                              style={{ backgroundColor: card }}
                              title="Card surface"
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full shadow-xs ring-1 ring-black/10"
                              style={{ backgroundColor: accent }}
                              title="Primary accent"
                            />
                          </div>
                        </div>

                        {/* Interactive Visual Mini-Mockup Preview */}
                        <div
                          className="w-full rounded-xl p-2.5 border transition duration-200"
                          style={{
                            backgroundColor: bg,
                            borderColor: isSelected ? accent : "rgba(128, 128, 128, 0.2)",
                          }}
                        >
                          <div
                            className="rounded-lg p-2 border flex items-center justify-between gap-2 shadow-xs"
                            style={{
                              backgroundColor: card,
                              borderColor: "rgba(128, 128, 128, 0.15)",
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-xs"
                                style={{ backgroundColor: accent }}
                              >
                                <Play className="w-3 h-3 fill-current translate-x-0.2" />
                              </span>
                              <div>
                                <span
                                  className="text-[11px] font-bold block leading-tight font-arabic"
                                  style={{
                                    color: isDark ? "#ffffff" : "#0f172a",
                                  }}
                                >
                                  الجزء الأول
                                </span>
                                <span
                                  className="text-[9px] block leading-tight"
                                  style={{
                                    color: isDark ? "#94a3b8" : "#64748b",
                                  }}
                                >
                                  Al-Fatihah
                                </span>
                              </div>
                            </div>

                            {/* Simulated Audio Progress Line */}
                            <div className="w-16 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full w-2/3"
                                style={{ backgroundColor: accent }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-content-muted leading-relaxed">
                          {col.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL & PLAYBACK */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* 2.1.1 Rewind & Forward Defaults */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-brand-primary" />
                  Rewind & Forward Jump Durations
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-content-muted block mb-1.5 font-medium">
                      Rewind Step
                    </label>
                    <select
                      value={settings.rewindStepSeconds}
                      onChange={(e) =>
                        updateSettings({
                          rewindStepSeconds: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary font-mono"
                    >
                      <option value={5}>5 seconds</option>
                      <option value={10}>10 seconds</option>
                      <option value={15}>15 seconds (default)</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>60 seconds</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-content-muted block mb-1.5 font-medium">
                      Forward Step
                    </label>
                    <select
                      value={settings.forwardStepSeconds}
                      onChange={(e) =>
                        updateSettings({
                          forwardStepSeconds: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary font-mono"
                    >
                      <option value={5}>5 seconds</option>
                      <option value={10}>10 seconds</option>
                      <option value={15}>15 seconds (default)</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>60 seconds</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Default Playback Speed */}
              <div className="space-y-3 pt-4 border-t border-surface-border">
                <h4 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-brand-primary" />
                  Default Playback Speed
                </h4>
                <div>
                  <label className="text-xs text-content-muted block mb-1.5 font-medium">
                    Starting playback speed when audio begins:
                  </label>
                  <select
                    value={settings.defaultPlaybackSpeed ?? 1.0}
                    onChange={(e) => {
                      const speed = parseFloat(e.target.value) as PlaybackSpeed;
                      updateSettings({ defaultPlaybackSpeed: speed });
                    }}
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary font-mono"
                  >
                    <option value={0.5}>0.5x (Slow)</option>
                    <option value={1.0}>1.0x (Normal - Default)</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={1.75}>1.75x</option>
                    <option value={2.0}>2.0x (Fast)</option>
                  </select>
                </div>
              </div>

              {/* 3.3 Playback Reading Timer */}
              <div className="space-y-3 pt-4 border-t border-surface-border">
                <h4 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-primary" />
                  Playback Reading Timer
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-content-muted block mb-1.5 font-medium">
                      Default Timer Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={settings.timerTargetMinutes}
                      onChange={(e) =>
                        updateSettings({
                          timerTargetMinutes: Math.max(1, parseInt(e.target.value, 10) || 30),
                        })
                      }
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                </div>

                {/* AutoTimer Setting on Next Track */}
                <div className="pt-2">
                  <label className="text-xs text-content-muted block mb-1.5 font-medium">
                    AutoTimer Setting on Next Track (Minutes)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={settings.autoTimerDurationMinutes ?? settings.timerTargetMinutes}
                      onChange={(e) =>
                        updateSettings({
                          autoTimerDurationMinutes: Math.max(1, parseInt(e.target.value, 10) || 30),
                        })
                      }
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary font-mono"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateSettings({
                          autoTimerDurationMinutes: settings.timerTargetMinutes,
                        })
                      }
                      className="shrink-0 px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-xs font-semibold text-content-secondary border border-surface-border transition cursor-pointer"
                    >
                      Match Default
                    </button>
                  </div>
                  <p className="text-[11px] text-content-muted mt-1">
                    When an audio file finishes, the Big Timer will automatically reset to this duration as it moves on to the next Juz.
                  </p>
                </div>
              </div>

              {/* 4.2 Daily Streak Habit Goal & Start Day */}
              <div className="space-y-3 pt-4 border-t border-surface-border">
                <h4 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                  <Flame className="w-4 h-4 text-brand-primary" />
                  Daily Streak Habit Goal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-content-muted block mb-1.5 font-medium">
                      Daily Streak Target (Minutes)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={720}
                      value={settings.streakTargetMinutes ?? settings.timerTargetMinutes ?? 30}
                      onChange={(e) =>
                        updateSettings({
                          streakTargetMinutes: Math.max(1, parseInt(e.target.value, 10) || 30),
                        })
                      }
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-content-muted block mb-1.5 font-medium">
                      Weekly Streak Start Day
                    </label>
                    <select
                      value={settings.streakStartDay}
                      onChange={(e) =>
                        updateSettings({
                          streakStartDay: parseInt(e.target.value, 10) as DayOfWeek,
                        })
                      }
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary"
                    >
                      <option value={1}>Monday (Default)</option>
                      <option value={0}>Sunday</option>
                      <option value={6}>Saturday</option>
                      <option value={5}>Friday</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Audio Source Preference */}
              <div className="space-y-3 pt-4 border-t border-surface-border">
                <h4 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-brand-primary" />
                  Audio Source Preference
                </h4>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                  <div>
                    <span className="text-sm text-content-primary font-medium block">
                      Prefer Local Downloaded Audio
                    </span>
                    <span className="text-xs text-content-muted">
                      Plays local WebM files when available, falling back automatically to online stream
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.preferLocalAudio}
                    onChange={(e) =>
                      updateSettings({
                        preferLocalAudio: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-brand-primary rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMIZE JUZ NAMES AND RANGES */}
          {/* TAB 3: TALLY & STREAKS PROGRESS ADJUSTER */}
          {activeTab === "progress" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Info */}
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-content-primary flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-brand-primary" />
                  Manual Juz Tally & Streak Adjustments
                </h4>
                <p className="text-xs text-content-muted">
                  Manually adjust completed Juzes, total tally, and past 30-day streak count.
                </p>
              </div>

              {/* Section 1: Total Juz Tally */}
              <div className="p-4 rounded-2xl bg-surface-subtle/60 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-content-primary block">
                      Total Juz Tally
                    </span>
                    <span className="text-xs text-content-muted">
                      Number of completed Juz recitations tracked overall
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-brand-primary bg-brand-light px-3 py-1 rounded-xl border border-brand-primary/20">
                    {manualTallyInput} Completed
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManualTallyInput((prev) => Math.max(0, prev - 1))}
                    title="Decrease tally by 1"
                    className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={manualTallyInput}
                    onChange={(e) =>
                      setManualTallyInput(Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="flex-1 bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-center text-base font-mono font-bold text-content-primary focus:outline-none focus:border-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setManualTallyInput((prev) => prev + 1)}
                    title="Increase tally by 1"
                    className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section 2: 30 Juz Checklist Completion */}
              <div className="p-4 rounded-2xl bg-surface-subtle/60 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-content-primary block">
                      30 Juz Checklist Status
                    </span>
                    <span className="text-xs text-content-muted">
                      Select which of the 30 Juzes are marked done ({manualCompletedJuzs.length}/30)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const all30 = Array.from({ length: 30 }, (_, i) => i + 1);
                        setManualCompletedJuzs(all30);
                        setManualTallyInput((prev) => Math.max(prev, 30));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-card hover:bg-surface-hover text-[11px] font-semibold text-brand-primary border border-surface-border transition cursor-pointer"
                    >
                      Check All
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualCompletedJuzs([])}
                      className="px-2.5 py-1 rounded-lg bg-surface-card hover:bg-surface-hover text-[11px] font-semibold text-content-muted hover:text-content-primary border border-surface-border transition cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Grid of 30 Juzes */}
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-1.5 pt-1">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((juzId) => {
                    const isChecked = manualCompletedJuzs.includes(juzId);
                    return (
                      <button
                        type="button"
                        key={juzId}
                        onClick={() => {
                          setManualCompletedJuzs((prev) => {
                            const next = isChecked
                              ? prev.filter((id) => id !== juzId)
                              : [...prev, juzId].sort((a, b) => a - b);
                            return next;
                          });
                        }}
                        title={`Juz ${juzId}: ${isChecked ? "Done (click to unmark)" : "Not done (click to mark)"}`}
                        className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono transition-all cursor-pointer border ${
                          isChecked
                            ? "bg-brand-primary text-white border-brand-primary shadow-sm ring-1 ring-brand-primary/30"
                            : "bg-surface-card hover:bg-surface-hover text-content-muted border-surface-border"
                        }`}
                      >
                        {juzId}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Past 30 Days Streak */}
              <div className="p-4 rounded-2xl bg-surface-subtle/60 border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-content-primary block">
                      Past 30 Days Streak
                    </span>
                    <span className="text-xs text-content-muted">
                      Number of days completed in the 30-day streak indicator
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-brand-primary bg-brand-light px-3 py-1 rounded-xl border border-brand-primary/20">
                    {manualStreakDays}/30 ({Math.round((manualStreakDays / 30) * 100)}%)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManualStreakDays((prev) => Math.max(0, prev - 1))}
                    title="Decrease streak by 1 day"
                    className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={manualStreakDays}
                    onChange={(e) =>
                      setManualStreakDays(Math.max(0, Math.min(30, parseInt(e.target.value, 10) || 0)))
                    }
                    className="flex-1 bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-center text-base font-mono font-bold text-content-primary focus:outline-none focus:border-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setManualStreakDays((prev) => Math.min(30, prev + 1))}
                    title="Increase streak by 1 day"
                    className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Save Button & Notice */}
              <div className="pt-2 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setJuzTallyManually(manualTallyInput, manualCompletedJuzs);
                    setCompletedStreakDaysManually(manualStreakDays);
                    setProgressSaveNotice("Juz tally and streaks successfully updated!");
                    setTimeout(() => setProgressSaveNotice(null), 3000);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-hover text-white font-bold text-sm shadow-md transition active:scale-98 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Tally & Streak Adjustments</span>
                </button>

                {progressSaveNotice && (
                  <div className="flex items-center gap-1.5 text-xs text-brand-primary font-semibold animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{progressSaveNotice}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMIZE 30 JUZS */}
          {activeTab === "juz" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-content-muted block font-medium">
                  Select Juz to Customize
                </label>
                <select
                  value={selectedJuzEdit}
                  onChange={(e) => handleSelectJuzToEdit(parseInt(e.target.value, 10))}
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary"
                >
                  {juzList.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.customName || j.defaultName} - {j.customRange || j.defaultRange}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs text-content-muted block mb-1.5 font-medium">
                    Juz Audio Display Name
                  </label>
                  <input
                    type="text"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    placeholder={`e.g. ${currentEditJuz.defaultName}`}
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="text-xs text-content-muted block mb-1.5 font-medium">
                    Juz Surah Range
                  </label>
                  <textarea
                    rows={3}
                    value={customRangeInput}
                    onChange={(e) => setCustomRangeInput(e.target.value)}
                    placeholder={`e.g. ${currentEditJuz.defaultRange}`}
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResetJuzToDefault}
                    className="text-xs text-content-muted hover:text-content-primary underline"
                  >
                    Reset to Default
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveJuzCustomization}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-brand-primary hover:bg-brand-hover text-white shadow-md transition"
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MEDIA DOWNLOADS */}
          {activeTab === "media" && <MediaDownloadsList />}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-card border-t border-surface-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-primary font-medium text-sm border border-surface-border transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
