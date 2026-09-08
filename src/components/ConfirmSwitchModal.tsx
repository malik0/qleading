"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { JuzInfo } from "../types/quran";

interface ConfirmSwitchModalProps {
  pendingJuzId: number | null;
  juzList: JuzInfo[];
  onConfirm: (juzId: number) => void;
  onCancel: () => void;
}

export const ConfirmSwitchModal: React.FC<ConfirmSwitchModalProps> = ({
  pendingJuzId,
  juzList,
  onConfirm,
  onCancel,
}) => {
  if (pendingJuzId === null) return null;

  const targetJuz = juzList.find((j) => j.id === pendingJuzId);
  const targetName = targetJuz?.customName || targetJuz?.defaultName || `Juz ${pendingJuzId}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-card border border-surface-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 transition-colors duration-200">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/15 text-amber-500 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-content-primary">
              Switch Audio Track?
            </h3>
            <p className="text-sm text-content-muted mt-1">
              Audio is currently playing. Would you like to stop current playback and start playing{" "}
              <strong className="text-brand-primary font-medium">{targetName}</strong>?
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-content-secondary hover:text-content-primary bg-surface-subtle hover:bg-surface-hover border border-surface-border transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(pendingJuzId)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-primary hover:bg-brand-hover shadow-lg transition"
          >
            Yes, Switch and Play
          </button>
        </div>
      </div>
    </div>
  );
};

