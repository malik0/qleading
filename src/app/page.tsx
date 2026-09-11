"use client";

import React, { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { QLogo } from "../components/QLogo";
import { JuzDisplay } from "../components/JuzDisplay";
import { StreakCounter } from "../components/StreakCounter";
import { ReadingChart } from "../components/ReadingChart";
import { JuzListTable } from "../components/JuzListTable";
import { KhatmPlanner } from "../components/KhatmPlanner";
import { SettingsModal } from "../components/SettingsModal";
import { UserAuthModal } from "../components/UserAuthModal";
import { ConfirmSwitchModal } from "../components/ConfirmSwitchModal";
import { RollBackModal } from "../components/RollBackModal";
import { BackToTopButton } from "../components/BackToTopButton";
import { useApp } from "../context/AppContext";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    juzList,
    pendingJuzSwitch,
    confirmJuzSwitch,
    cancelJuzSwitch,
    isRollBackOpen,
    closeRollBack,
  } = useApp();

  if (!mounted) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-surface-base text-content-primary">
        <header className="w-full bg-surface-card/90 backdrop-blur-md border-b border-surface-border sticky top-0 z-40 px-4 py-3 sm:px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg">
                <QLogo className="w-10 h-10" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-content-primary">Qleading</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 animate-pulse">
          <div className="h-[460px] rounded-3xl bg-surface-card border border-surface-border" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-surface-base text-content-primary transition-colors duration-200">
      {/* Top Header with Profile & Settings */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* 1.0 - 2.3 JUZ DISPLAY, HERO TIMER & PLAYBACK CONTROLS (UNIFIED SINGLE PANEL) */}
        <JuzDisplay />

        {/* 4.0 - 4.4 STREAK COUNTER (WEEKLY M T W T F S S & MONTHLY CALENDAR) */}
        <StreakCounter />

        {/* 5.0 - 5.1 24-HOUR VERTICAL READING CHART (15-MIN SLOTS) */}
        <ReadingChart />

        {/* 6.0 THE 30 JUZ LIST AT THE BOTTOM OF THE PAGE */}
        <JuzListTable />

        {/* 7.0 KHATM PLANNER (LISTENING JOURNEY & PROGRESS TOWARD FINISH LINE) */}
        <KhatmPlanner />
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-surface-border text-center text-xs text-content-muted">
        <p>
          Qleading &copy; {new Date().getFullYear()}
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

      <RollBackModal
        isOpen={isRollBackOpen}
        onClose={closeRollBack}
      />

      {/* Floating Back to Top Button */}
      <BackToTopButton />
    </div>
  );
}

