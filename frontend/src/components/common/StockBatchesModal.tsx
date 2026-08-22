import React from 'react';
import { Package, Calendar, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface StockBatchesModalProps {
  drug: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockBatchesModal: React.FC<StockBatchesModalProps> = ({ drug, isOpen, onClose }) => {
  if (!isOpen || !drug) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-950 border border-amber-500/30 rounded-xl text-amber-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Stock Batch Inventory & Expiry Tracker</h3>
            <p className="text-xs text-slate-400">
              Medication: <span className="text-cyan-300 font-semibold">{drug.name}</span> ({drug.code})
            </p>
          </div>
        </div>

        {/* Batches Table */}
        {!drug.batches || drug.batches.length === 0 ? (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500 mb-6">
            No specific stock batches recorded for this SKU yet. Default master stock: {drug.quantityInStock} {drug.unit}.
          </div>
        ) : (
          <div className="border border-slate-800 rounded-xl overflow-hidden mb-6 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Batch #</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">Supplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {drug.batches.map((b: any) => {
                  const isExpired = new Date(b.expiryDate) < new Date();
                  return (
                    <tr key={b.id} className="hover:bg-slate-900/60">
                      <td className="p-3 font-mono font-bold text-cyan-400">{b.batchNumber}</td>
                      <td className="p-3 font-bold text-white">{b.quantity} {drug.unit}</td>
                      <td className="p-3 font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            isExpired
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                              : 'text-emerald-400'
                          }`}
                        >
                          {b.expiryDate} {isExpired && '(Expired)'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{b.supplier || 'Standard Supplier'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
          >
            Close Batch Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
