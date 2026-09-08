"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { formatAudioTime } from "../lib/utils";
import {
  X,
  User,
  LogIn,
  LogOut,
  ListOrdered,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { userState, loginUser, logoutUser, userLogs } = useApp();

  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [activeTab, setActiveTab] = useState<"auth" | "logs">("auth");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubmitting(true);
    await loginUser(emailInput.trim(), nameInput.trim() || undefined);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-card border border-surface-border rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-brand-light text-brand-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-content-primary">
                {userState.isLoggedIn ? "User Account & Logs" : "Sign In to Qleading"}
              </h3>
              <p className="text-xs text-content-muted">
                Multi-device position sync and personalized reading history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-muted hover:text-content-primary transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-surface-border px-6 bg-surface-subtle/50">
          <button
            onClick={() => setActiveTab("auth")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === "auth"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-content-muted hover:text-content-primary"
            }`}
          >
            Account & Sync
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-content-muted hover:text-content-primary"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Reading Logs ({userLogs.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === "auth" ? (
            userState.isLoggedIn ? (
              /* Logged In View */
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-subtle border border-surface-border">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))",
                    }}
                  >
                    {userState.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-content-primary flex items-center gap-1.5">
                      {userState.userName}
                      <ShieldCheck className="w-4 h-4 text-brand-primary" />
                    </h4>
                    <p className="text-xs text-content-muted">{userState.userEmail}</p>
                    <span className="text-[10px] text-brand-primary font-mono mt-1 block">
                      Multi-Device Sync Active
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-light/40 border border-brand-primary/20 text-xs text-content-secondary space-y-1">
                  <p className="font-semibold text-brand-primary flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                    Seamless Synchronization Enabled
                  </p>
                  <p className="text-content-muted">
                    Your playback location and timer value are safely saved each second and reconciled across your phones, tablets, and computers using the latest timestamp.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={logoutUser}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-medium text-sm transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out of Account
                  </button>
                </div>
              </div>
            ) : (
              /* Sign In View */
              <form onSubmit={handleLogin} className="space-y-4">
                <p className="text-sm text-content-secondary">
                  Log in to sync your audio position, timer, and daily streaks seamlessly across all your devices.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-content-muted block mb-1 font-medium">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2.5 text-sm text-content-primary focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-content-muted block mb-1 font-medium">
                      Display Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2.5 text-sm text-content-primary focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-primary hover:bg-brand-hover text-white font-bold text-sm shadow-lg transition disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  {isSubmitting ? "Signing In..." : "Sign In & Sync"}
                </button>
              </form>
            )
          ) : (
            /* 0.1 CHRONOLOGICAL USER LOGS */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-content-muted">
                  All listening sessions and completions tracked chronologically
                </p>
              </div>

              {userLogs.length === 0 ? (
                <div className="text-center py-10 text-content-muted text-sm">
                  No reading logs recorded yet. Start listening to build your reading history!
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {userLogs.map((log) => {
                    const dateFormatted = new Date(log.timestamp).toLocaleString();

                    return (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-content-primary block">
                            {log.juzName}
                          </span>
                          <span className="text-content-muted text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateFormatted}
                          </span>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-brand-primary font-semibold block">
                            {formatAudioTime(log.durationSeconds)}
                          </span>
                          <span className="text-[10px] text-content-muted">
                            {log.playbackSpeed}x speed
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-card border-t border-surface-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-hover text-content-primary font-medium text-sm border border-surface-border transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
