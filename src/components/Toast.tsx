import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface Props {
  message: string | null;
  onDismiss: () => void;
}

export const Toast: React.FC<Props> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#1C1B22] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-white transition ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
