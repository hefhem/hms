import React, { useState, useEffect } from 'react';
import { Globe, X, Check, Lock, ShieldAlert } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

interface CurrencySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CurrencySettingsModal: React.FC<CurrencySettingsModalProps> = ({ isOpen, onClose }) => {
  const { currencySymbol, currencyCode, isCurrencyLocked, updateCurrency } = useSettings();
  const [symbol, setSymbol] = useState(currencySymbol);
  const [code, setCode] = useState(currencyCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSymbol(currencySymbol);
      setCode(currencyCode);
    }
  }, [isOpen, currencySymbol, currencyCode]);

  if (!isOpen) return null;

  const presets = [
    { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
    { symbol: '€', code: 'EUR', name: 'Euro (€)' },
    { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
    { symbol: '₦', code: 'NGN', name: 'Nigerian Naira (₦)' },
    { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
    { symbol: 'AED', code: 'AED', name: 'UAE Dirham (AED)' },
    { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar (C$)' },
    { symbol: 'A$', code: 'AUD', name: 'Australian Dollar (A$)' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrencyLocked) {
      showToast('error', 'Currency Locked', 'Financial transactions exist. Currency changes are forbidden.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCurrency(symbol, code);
      showToast('success', 'Currency Configured', `System base currency set to ${symbol} (${code})`);
      onClose();
    } catch (err: any) {
      showToast('error', 'Update Denied', err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 bg-slate-800 rounded-full">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 bg-cyan-950 border border-cyan-500/30 rounded-2xl text-cyan-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">System Base Currency</h3>
            <p className="text-xs text-slate-400">Financial Ledger Base Currency Configuration</p>
          </div>
        </div>

        {/* Financial Lock Banner Warning */}
        {isCurrencyLocked ? (
          <div className="bg-rose-950/50 border border-rose-500/40 p-4 rounded-2xl mb-5 space-y-1">
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Base Currency Locked</span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              Financial transactions (invoices/payments) have already been posted to the database. System currency is permanently locked to prevent accounting ledger corruption.
            </p>
          </div>
        ) : (
          <div className="bg-cyan-950/40 border border-cyan-500/30 p-3 rounded-2xl mb-5 text-xs text-cyan-300">
            ℹ️ You can configure your base system currency before posting your first patient invoice.
          </div>
        )}

        {/* Presets */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Currency Presets
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.code}
                type="button"
                disabled={isCurrencyLocked}
                onClick={() => {
                  setSymbol(p.symbol);
                  setCode(p.code);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                  code === p.code
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                } ${isCurrencyLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>{p.name}</span>
                {code === p.code && <Check className="w-4 h-4 text-cyan-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Currency Symbol</label>
              <input
                type="text"
                required
                disabled={isCurrencyLocked}
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-bold disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Currency Code</label>
              <input
                type="text"
                required
                disabled={isCurrencyLocked}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
            >
              Close
            </button>
            {!isCurrencyLocked && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950"
              >
                {isSubmitting ? 'Saving...' : 'Apply Currency'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
