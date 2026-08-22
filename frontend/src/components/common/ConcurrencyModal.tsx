import React, { useEffect, useState } from 'react';
import { Lock, RefreshCw } from 'lucide-react';

export const ConcurrencyModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleConflict = (e: any) => {
      setMessage(
        e.detail?.message ||
          'Optimistic Concurrency Lock Conflict: Another user updated this record while you were making changes.',
      );
      setIsOpen(true);
    };

    window.addEventListener('hms-concurrency-conflict', handleConflict);
    return () => window.removeEventListener('hms-concurrency-conflict', handleConflict);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center gap-3 text-amber-400 mb-4">
          <div className="p-3 bg-amber-950/60 border border-amber-500/30 rounded-xl">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Concurrency Conflict (409 Block)</h3>
            <p className="text-xs text-amber-300">Optimistic Locking Protection Triggered</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setIsOpen(false);
              window.location.reload();
            }}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-950 flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Latest State
          </button>
        </div>
      </div>
    </div>
  );
};
