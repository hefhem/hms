import React, { useEffect, useState } from 'react';
import { Pill, Plus, CheckCircle2, AlertTriangle, Package, Calendar, X, Eye } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { ExportOptions } from '../components/common/ExportOptions';
import { StockBatchesModal } from '../components/common/StockBatchesModal';

export const PharmacyView: React.FC = () => {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [pendingPrescriptions, setPendingPrescriptions] = useState<any[]>([]);
  const [isAddDrugModalOpen, setIsAddDrugModalOpen] = useState(false);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [isViewBatchesModalOpen, setIsViewBatchesModalOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);

  const { formatCurrency } = useSettings();

  // Drug Form
  const [drugForm, setDrugForm] = useState({
    code: 'DRUG-NEW-01',
    name: '',
    category: 'Antibiotics',
    unitPrice: 10.0,
    quantityInStock: 100,
    reorderLevel: 20,
    unit: 'Tablets',
  });

  // Batch Form
  const [batchForm, setBatchForm] = useState({
    batchNumber: 'BATCH-2026-X01',
    quantity: 50,
    expiryDate: '2027-12-31',
    supplier: 'PharmaDistributors Corp',
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [drugRes, rxRes] = await Promise.all([
        api.get('/pharmacy/drugs'),
        api.get('/emr/prescriptions/pending'),
      ]);
      setDrugs(drugRes.data);
      setPendingPrescriptions(rxRes.data);
    } catch (err: any) {
      showToast('error', 'Error Loading Pharmacy', err.message);
    }
  };

  const handleCreateDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/pharmacy/drugs', drugForm);
      showToast('success', 'Drug Cataloged', `'${drugForm.name}' added to inventory.`);
      setIsAddDrugModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Save Failed', err.response?.data?.message || err.message);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDrug) return;
    try {
      await api.post(`/pharmacy/drugs/${selectedDrug.id}/batches`, batchForm);
      showToast('success', 'Stock Replenished', `Batch added to ${selectedDrug.name}`);
      setIsAddBatchModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Batch Addition Failed', err.message);
    }
  };

  const handleDispense = async (rxId: string) => {
    try {
      const res = await api.post(`/pharmacy/dispense/${rxId}`);

      await api.post('/billing/invoices', {
        patientId: res.data.prescription.patientId,
        prescriptionId: res.data.prescription.id,
        lineItems: res.data.lineItems,
        notes: `Auto-generated from Pharmacy Dispense (Rx #${rxId.slice(0, 8)})`,
      });

      showToast(
        'success',
        'Prescription Dispensed',
        `Stock deducted safely with Version Lock. Total: ${formatCurrency(res.data.totalCost)}. Invoice generated.`,
      );
      fetchData();
    } catch (err: any) {
      showToast('error', 'Dispensing Failed', err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Prescriptions Dispensing Queue */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-950 border border-amber-500/30 rounded-xl text-amber-400">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Pending Prescription Dispensing Queue</h3>
            <p className="text-xs text-slate-400">
              Pharmacist verification & optimistic stock deduction
            </p>
          </div>
        </div>

        {pendingPrescriptions.length === 0 ? (
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
            No pending doctor prescriptions in queue.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingPrescriptions.map((rx) => (
              <div key={rx.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{rx.patientName}</span>
                  <span className="text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                    PENDING DISPENSE
                  </span>
                </div>

                <div className="text-xs text-slate-400">Prescribed by {rx.doctorName}</div>

                <div className="space-y-1 bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                  {rx.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-cyan-300 font-medium">{item.drugName} ({item.dosage})</span>
                      <span className="text-slate-400">Qty: {item.quantity} ({item.frequency})</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleDispense(rx.id)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-1.5 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify & Dispense Medication
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drug Inventory Catalog */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Drug Stock Inventory</h3>
            <p className="text-xs text-slate-400">Real-time stock quantities with Optimistic Lock versioning</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportOptions data={drugs} filename="hms_pharmacy_inventory" />
            <button
              onClick={() => setIsAddDrugModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Drug SKU
            </button>
          </div>
        </div>

        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">SKU Code</th>
              <th className="p-4">Medication Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Unit Price</th>
              <th className="p-4">In Stock</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {drugs.map((d) => {
              const isLow = d.quantityInStock <= d.reorderLevel;
              return (
                <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono text-xs font-bold text-slate-400">{d.code}</td>
                  <td className="p-4 font-semibold text-white">{d.name}</td>
                  <td className="p-4 text-slate-400 text-xs">{d.category}</td>
                  <td className="p-4 font-mono text-emerald-400">{formatCurrency(d.unitPrice)} / {d.unit}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        isLow
                          ? 'bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {d.quantityInStock} {d.unit} {isLow && '(Low Stock)'}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">v{d.version}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDrug(d);
                        setIsViewBatchesModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                      title="Inspect Stock Batches & Expiry Dates"
                    >
                      <Eye className="w-3.5 h-3.5 text-purple-400" />
                      View Batches
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDrug(d);
                        setIsAddBatchModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                    >
                      <Package className="w-3.5 h-3.5 text-cyan-400" />
                      + Add Batch
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Drug SKU Modal */}
      {isAddDrugModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsAddDrugModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Add New Drug SKU</h3>

            <form onSubmit={handleCreateDrug} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={drugForm.code}
                    onChange={(e) => setDrugForm({ ...drugForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={drugForm.category}
                    onChange={(e) => setDrugForm({ ...drugForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  value={drugForm.name}
                  onChange={(e) => setDrugForm({ ...drugForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Unit Price</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={drugForm.unitPrice}
                    onChange={(e) => setDrugForm({ ...drugForm, unitPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={drugForm.quantityInStock}
                    onChange={(e) => setDrugForm({ ...drugForm, quantityInStock: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Unit Type</label>
                  <input
                    type="text"
                    required
                    value={drugForm.unit}
                    onChange={(e) => setDrugForm({ ...drugForm, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddDrugModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950"
                >
                  Save SKU
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {isAddBatchModalOpen && selectedDrug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsAddBatchModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Replenish Stock Batch</h3>
            <p className="text-xs text-slate-400 mb-4">Medication: {selectedDrug.name}</p>

            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Batch Number</label>
                <input
                  type="text"
                  required
                  value={batchForm.batchNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Supplier</label>
                <input
                  type="text"
                  value={batchForm.supplier}
                  onChange={(e) => setBatchForm({ ...batchForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddBatchModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950"
                >
                  Add Stock Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Batches Inspection Modal */}
      <StockBatchesModal
        drug={selectedDrug}
        isOpen={isViewBatchesModalOpen}
        onClose={() => setIsViewBatchesModalOpen(false)}
      />
    </div>
  );
};
