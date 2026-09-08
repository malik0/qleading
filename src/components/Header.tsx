"use client";

import React from "react";
import { useApp } from "../context/AppContext";
import { RefreshCw, Settings, User } from "lucide-react";
import { QLogo } from "./QLogo";

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onOpenAuth,
}) => {
  const { userState, isSyncing, lastSynced, manualSync } = useApp();

  return (
    <header className="w-full bg-surface-card/90 backdrop-blur-md border-b border-surface-border sticky top-0 z-40 px-4 py-3 sm:px-6 transition-colors duration-200">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* App Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-105">
            <QLogo className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-content-primary flex items-center gap-2">
              Qleading
              <span className="text-[10px] uppercase font-semibold tracking-wider bg-brand-light text-brand-primary border border-brand-primary/30 px-2 py-0.5 rounded-full">
                PWA
              </span>
            </h1>
            <p className="text-xs text-content-muted hidden sm:block">
              Continuous 30 Juz Quran Recitation & Reading Tracker
            </p>
          </div>
        </div>

        {/* User, Sync, Theme & Settings Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">

          {/* Sync status & button */}
          <button
            onClick={manualSync}
            disabled={isSyncing}
            title={
              lastSynced
                ? `Last synced at ${lastSynced}. Click to sync now.`
                : "Sync with Cloud"
            }
            className="flex items-center gap-1.5 text-xs text-content-secondary hover:text-content-primary bg-surface-subtle hover:bg-surface-hover px-2.5 py-1.5 rounded-xl border border-surface-border transition shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isSyncing ? "animate-spin text-brand-primary" : "text-content-muted"
              }`}
            />
            <span className="hidden md:inline">
              {isSyncing ? "Syncing..." : lastSynced ? "Synced" : "Sync"}
            </span>
          </button>

          {/* User Profile / Login */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 text-xs bg-surface-subtle hover:bg-surface-hover px-3 py-1.5 rounded-xl border border-surface-border text-content-secondary hover:text-content-primary transition shadow-sm"
          >
            <User className="w-4 h-4 text-brand-primary" />
            <span className="max-w-[90px] sm:max-w-[120px] truncate font-medium">
              {userState.isLoggedIn ? userState.userName : "Login"}
            </span>
          </button>

          {/* Settings Modal Opener */}
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-secondary hover:text-content-primary border border-surface-border transition shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

