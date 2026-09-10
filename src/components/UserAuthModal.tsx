"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
  Shuffle,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Mail,
  AlertCircle,
  Database,
  Trash2,
  History,
} from "lucide-react";
import { RollBackContent } from "./RollBackModal";

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    userState,
    loginUser,
    registerUser,
    generateRandomUser,
    resetAccountDetails,
    logoutUser,
    userLogs,
    isSyncing,
    lastSynced,
    manualSync,
    syncPoints,
  } = useApp();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"auth" | "rollback" | "logs">("auth");
  const [unauthMode, setUnauthMode] = useState<"random" | "login" | "register">("random");

  // Form inputs for login / register
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");

  // Form inputs for resetting account details
  const [editUsername, setEditUsername] = useState(userState.userName);
  const [editEmail, setEditEmail] = useState(userState.userEmail);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmResetData, setConfirmResetData] = useState(false);

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Generated credentials display
  const [generatedCreds, setGeneratedCreds] = useState<{
    username: string;
    email: string;
    password?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Keep edit inputs in sync when user logs in or profile changes
  useEffect(() => {
    if (userState.isLoggedIn) {
      setEditUsername(userState.userName);
      setEditEmail(userState.userEmail);
    }
  }, [userState.isLoggedIn, userState.userName, userState.userEmail]);

  if (!isOpen) return null;

  const clearFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // 1. One-Click Random Account Handler
  const handleGenerateRandom = async () => {
    clearFeedback();
    setIsSubmitting(true);
    const res = await generateRandomUser();
    setIsSubmitting(false);

    if (res.success && res.credentials) {
      setGeneratedCreds(res.credentials);
      setSuccessMessage("Account generated and connected to Cloudflare D1!");
    } else {
      setErrorMessage(res.error || "Failed to generate random account.");
    }
  };

  // 2. Standard Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!emailInput.trim() || !passwordInput) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    const res = await loginUser(emailInput.trim(), passwordInput);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage("Logged in successfully! Progress synchronized.");
      setEmailInput("");
      setPasswordInput("");
    } else {
      setErrorMessage(res.error || "Invalid credentials.");
    }
  };

  // 3. Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!emailInput.trim() || !passwordInput) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    const res = await registerUser(
      nameInput.trim() || emailInput.split("@")[0],
      emailInput.trim(),
      passwordInput
    );
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage("Account registered and synchronized with Cloudflare D1!");
      setEmailInput("");
      setPasswordInput("");
      setNameInput("");
    } else {
      setErrorMessage(res.error || "Failed to create account.");
    }
  };

  // 4. Fill Register fields with random values
  const fillRegisterWithRandom = () => {
    const prefixes = ["Qari", "Reader", "Hafiz", "Tadabbur", "Noor", "Talib"];
    const rand = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const username = `${rand}_${num}`;
    setNameInput(username);
    setEmailInput(`${rand.toLowerCase()}_${num}@qleading.app`);
    setPasswordInput(`ql-${Math.random().toString(36).substring(2, 10)}`);
  };

  // 5. Reset Account Details Handler
  const handleResetDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsSubmitting(true);

    const res = await resetAccountDetails({
      username: editUsername.trim() !== userState.userName ? editUsername.trim() : undefined,
      email: editEmail.trim() !== userState.userEmail ? editEmail.trim() : undefined,
      currentPassword: currentPasswordInput || undefined,
      newPassword: newPasswordInput ? newPasswordInput.trim() : undefined,
      resetReadingData: confirmResetData,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message || "Account details updated successfully!");
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmResetData(false);
    } else {
      setErrorMessage(res.error || "Failed to update account details.");
    }
  };

  // 6. Randomize Identity for Logged In User
  const handleRandomizeCurrentIdentity = async () => {
    clearFeedback();
    setIsSubmitting(true);
    const res = await resetAccountDetails({ randomizeIdentity: true });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage("New random identity applied successfully!");
    } else {
      setErrorMessage(res.error || "Failed to re-randomize identity.");
    }
  };

  // Copy credentials to clipboard
  const handleCopyCredentials = () => {
    if (!generatedCreds) return;
    const text = `Username: ${generatedCreds.username}\nEmail: ${generatedCreds.email}\nPassword: ${generatedCreds.password || "(none)"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-card border border-surface-border rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="p-2 sm:p-2.5 rounded-xl bg-brand-light text-brand-primary shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-content-primary truncate sm:whitespace-normal">
                {userState.isLoggedIn ? "Account & Cloudflare Sync" : "Sign In to Qleading"}
              </h3>
              <p className="text-xs text-content-muted line-clamp-1 sm:line-clamp-none">
                Multi-device position sync powered by Cloudflare D1
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
        <div className="flex border-b border-surface-border px-4 sm:px-6 bg-surface-subtle/50 shrink-0">
          <button
            onClick={() => setActiveTab("auth")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === "auth"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-content-muted hover:text-content-primary"
            }`}
          >
            {userState.isLoggedIn ? "Account Details" : "Sign In & Sync"}
          </button>
          <button
            onClick={() => setActiveTab("rollback")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "rollback"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-content-muted hover:text-content-primary"
            }`}
          >
            <History className="w-4 h-4" />
            Roll Back ({syncPoints.length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-content-muted hover:text-content-primary"
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            Reading Logs ({userLogs.length})
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 min-h-0">
          {activeTab === "auth" ? (
            userState.isLoggedIn ? (
              /* LOGGED IN VIEW */
              <div className="space-y-6">
                
                {/* Profile Card */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-subtle border border-surface-border">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0"
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
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <Database className="w-3 h-3" />
                          Cloudflare D1 Connected
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={manualSync}
                    disabled={isSyncing}
                    title="Synchronize with Cloudflare D1"
                    className="p-2.5 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border text-content-secondary hover:text-content-primary transition shadow-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-brand-primary" : ""}`} />
                  </button>
                </div>

                {/* Sync status card */}
                <div className="p-4 rounded-2xl bg-brand-light/30 border border-brand-primary/20 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-brand-primary">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Multi-Device Sync Active
                    </span>
                    <span className="text-[11px] font-mono text-content-muted">
                      {lastSynced ? `Last synced: ${lastSynced}` : "Sync ready"}
                    </span>
                  </div>
                  <p className="text-content-muted leading-relaxed">
                    Audio position and reading timer are automatically synced to Cloudflare D1 whenever you pause, change Juz, or switch devices.
                  </p>
                </div>

                {/* Roll Back & Synch Points Quick Section */}
                <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand-primary shrink-0">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-content-primary">Roll Back & Synch Points</h5>
                      <p className="text-[11px] text-content-muted">
                        {syncPoints.length} synch point{syncPoints.length === 1 ? "" : "s"} saved • Undo accidental resets or jumps
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("rollback")}
                    className="text-xs text-brand-primary hover:text-brand-hover bg-brand-light/50 hover:bg-brand-light px-3 py-1.5 rounded-xl border border-brand-primary/20 transition font-semibold shrink-0"
                  >
                    View Points
                  </button>
                </div>

                {/* RESET / UPDATE ACCOUNT DETAILS FORM */}
                <div className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-4">
                  <div className="flex items-center justify-between border-b border-surface-border pb-3">
                    <div>
                      <h5 className="text-sm font-bold text-content-primary">Reset Account Details</h5>
                      <p className="text-[11px] text-content-muted">
                        Update your identity, credentials, or reset your listening progress
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRandomizeCurrentIdentity}
                      disabled={isSubmitting}
                      className="flex items-center gap-1 text-xs text-brand-primary hover:text-brand-hover bg-brand-light/50 px-2.5 py-1.5 rounded-lg border border-brand-primary/20 transition font-medium"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Randomize Identity
                    </button>
                  </div>

                  <form onSubmit={handleResetDetails} className="space-y-3.5">
                    <div>
                      <label className="text-xs text-content-muted block mb-1 font-medium">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="Your display name"
                        className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-content-muted block mb-1 font-medium">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="your-email@example.com"
                        className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-sm text-content-primary focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="pt-1 border-t border-surface-border/60">
                      <label className="text-xs text-content-muted block mb-1 font-medium">
                        Change Password (Optional)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="password"
                          value={currentPasswordInput}
                          onChange={(e) => setCurrentPasswordInput(e.target.value)}
                          placeholder="Current password"
                          className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-primary"
                        />
                        <input
                          type="password"
                          value={newPasswordInput}
                          onChange={(e) => setNewPasswordInput(e.target.value)}
                          placeholder="New password"
                          className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    {/* Reset Reading Data Checkbox */}
                    <div className="pt-2 border-t border-surface-border/60">
                      <label className="flex items-center gap-2 text-xs text-rose-500 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={confirmResetData}
                          onChange={(e) => setConfirmResetData(e.target.checked)}
                          className="rounded text-rose-500 focus:ring-rose-500 bg-surface-card border-surface-border"
                        />
                        <span className="flex items-center gap-1 font-medium">
                          <Trash2 className="w-3.5 h-3.5" />
                          Also reset all reading logs, streaks & progress to initial state
                        </span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-2 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-hover text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
                    >
                      {isSubmitting ? "Saving Changes..." : "Save Account Changes"}
                    </button>
                  </form>
                </div>

                {/* Log Out Button */}
                <div className="pt-1">
                  <button
                    onClick={logoutUser}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-medium text-xs transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out of Account
                  </button>
                </div>
              </div>
            ) : (
              /* UNAUTHENTICATED VIEW */
              <div className="space-y-5">
                
                {/* Mode Selector */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-surface-subtle border border-surface-border rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setUnauthMode("random");
                      clearFeedback();
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      unauthMode === "random"
                        ? "bg-brand-primary text-white shadow-md"
                        : "text-content-muted hover:text-content-primary"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    1-Click Random
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnauthMode("login");
                      clearFeedback();
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      unauthMode === "login"
                        ? "bg-brand-primary text-white shadow-md"
                        : "text-content-muted hover:text-content-primary"
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUnauthMode("register");
                      clearFeedback();
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 ${
                      unauthMode === "register"
                        ? "bg-brand-primary text-white shadow-md"
                        : "text-content-muted hover:text-content-primary"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Register
                  </button>
                </div>

                {/* 1. 1-CLICK RANDOM MODE */}
                {unauthMode === "random" && (
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-3">
                      <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                        <Sparkles className="w-4 h-4" />
                        Instant Zero-Friction Account
                      </div>
                      <p className="text-xs text-content-secondary leading-relaxed">
                        Generate a random account with 1 click. Your current reading progress, audio position, and streaks will automatically be preserved and synced to Cloudflare D1 across all your devices.
                      </p>
                      <p className="text-[11px] text-content-muted">
                        You can view, copy, or reset your account details at any time once logged in.
                      </p>

                      <button
                        type="button"
                        onClick={handleGenerateRandom}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-primary hover:bg-brand-hover text-white font-bold text-sm shadow-lg transition disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isSubmitting ? "Generating Account..." : "Generate Random Account & Sync"}
                      </button>
                    </div>

                    {/* Show generated credentials if just created */}
                    {generatedCreds && (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                        <div className="flex items-center justify-between font-semibold text-emerald-500">
                          <span>Your Generated Credentials</span>
                          <button
                            onClick={handleCopyCredentials}
                            className="flex items-center gap-1 text-[11px] bg-emerald-500/20 px-2 py-1 rounded-lg hover:bg-emerald-500/30 transition"
                          >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? "Copied!" : "Copy Details"}
                          </button>
                        </div>
                        <div className="font-mono text-[11px] space-y-0.5 text-content-secondary bg-surface-card/60 p-2.5 rounded-xl border border-surface-border">
                          <div><strong>Username:</strong> {generatedCreds.username}</div>
                          <div><strong>Email:</strong> {generatedCreds.email}</div>
                          <div><strong>Password:</strong> {generatedCreds.password}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. SIGN IN MODE */}
                {unauthMode === "login" && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <p className="text-xs text-content-secondary">
                      Sign in to sync your audio position, timer, and daily streaks from Cloudflare D1.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-content-muted block mb-1 font-medium flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
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
                        <label className="text-xs text-content-muted block mb-1 font-medium flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
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
                )}

                {/* 3. REGISTER MODE */}
                {unauthMode === "register" && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-content-secondary">
                        Create an account to persist your recitation history.
                      </p>
                      <button
                        type="button"
                        onClick={fillRegisterWithRandom}
                        className="flex items-center gap-1 text-[11px] text-brand-primary font-medium hover:underline"
                      >
                        <Shuffle className="w-3 h-3" />
                        Fill Random
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-content-muted block mb-1 font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="e.g. Qari_5821"
                          className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2.5 text-sm text-content-primary focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-content-muted block mb-1 font-medium flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
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
                        <label className="text-xs text-content-muted block mb-1 font-medium flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" />
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2.5 text-sm text-content-primary focus:outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-primary hover:bg-brand-hover text-white font-bold text-sm shadow-lg transition disabled:opacity-50"
                    >
                      <User className="w-4 h-4" />
                      {isSubmitting ? "Creating Account..." : "Create Account & Sync"}
                    </button>
                  </form>
                )}

              </div>
            )
          ) : activeTab === "rollback" ? (
            <RollBackContent onRollbackComplete={onClose} />
          ) : (
            /* CHRONOLOGICAL USER LOGS */
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
                    const dateFormatted = new Date(log.timestamp).toLocaleString("en-US");

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
