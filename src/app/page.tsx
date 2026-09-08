"use client";

import React, { useState } from "react";
import { Header } from "../components/Header";
import { JuzDisplay } from "../components/JuzDisplay";
import { PlaybackControls } from "../components/PlaybackControls";
import { StreakCounter } from "../components/StreakCounter";
import { ReadingChart } from "../components/ReadingChart";
import { JuzListTable } from "../components/JuzListTable";
import { SettingsModal } from "../components/SettingsModal";
import { UserAuthModal } from "../components/UserAuthModal";
import { ConfirmSwitchModal } from "../components/ConfirmSwitchModal";
import { useApp } from "../context/AppContext";

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const {
    juzList,
    pendingJuzSwitch,
    confirmJuzSwitch,
    cancelJuzSwitch,
  } = useApp();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface-base text-content-primary transition-colors duration-200">
      {/* Top Header with Profile & Settings */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6 sm:px-6 space-y-4 sm:space-y-6">
        {/* 1.0 - 1.4 JUZ DISPLAY & HERO TIMER */}
        <JuzDisplay />

        {/* 2.0 - 2.3 PLAYBACK CONTROLS */}
        <PlaybackControls />

        {/* 4.0 - 4.4 STREAK COUNTER (WEEKLY M T W T F S S & MONTHLY CALENDAR) */}
        <StreakCounter />

        {/* 5.0 - 5.1 24-HOUR VERTICAL READING CHART (15-MIN SLOTS) */}
        <ReadingChart />

        {/* 6.0 THE 30 JUZ LIST AT THE BOTTOM OF THE PAGE */}
        <JuzListTable />
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-surface-border text-center text-xs text-content-muted">
        <p>
          Qleading &copy; {new Date().getFullYear()} — Holy Quran 30 Juz Audio Player & Reading Tracker
        </p>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <UserAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <ConfirmSwitchModal
        pendingJuzId={pendingJuzSwitch}
        juzList={juzList}
        onConfirm={confirmJuzSwitch}
        onCancel={cancelJuzSwitch}
      />
    </div>
  );
}

