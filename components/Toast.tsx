import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[300] flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-950 border border-lime-400/50 text-white shadow-xl glow-lime-sm animate-in fade-in slide-in-from-bottom-2 text-xs font-bold">
      <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
      <span>{message}</span>
      <button 
        onClick={onClose} 
        className="ml-2 text-emerald-400 hover:text-white text-sm leading-none p-0.5"
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};
