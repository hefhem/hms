import React, { useEffect, useState } from 'react';
import { Film, Plus, CheckCircle2, Printer, X, Eye } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { ExportOptions } from '../components/common/ExportOptions';
import { SearchableSelect, Option } from '../components/common/SearchableSelect';

export const RadiologyView: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { formatCurrency, clinicName } = useSettings();
  const { showToast } = useToast();

  const [orderForm, setOrderForm] = useState({
    patientId: '',
    modality: 'X-Ray',
    procedureName: 'Chest X-Ray Digital View (PA/AP)',
    cost: 85.0,
  });

  const [notes, setNotes] = useState('');
  const [impression, setImpression] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordRes, patRes] = await Promise.all([api.get('/radiology/orders'), api.get('/patients')]);
      setOrders(ordRes.data);
      setPatients(patRes.data);
      if (patRes.data.length > 0) {
        setOrderForm((prev) => ({ ...prev, patientId: patRes.data[0].id }));
      }
    } catch (err: any) {
      showToast('error', 'Error Loading RIS Data', err.message);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/radiology/orders', orderForm);
      showToast('success', 'Imaging Order Created', 'Radiology order dispatched & invoice added to billing.');
      setIsOrderModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Order Failed', err.response?.data?.message || err.message);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await api.put(`/radiology/orders/${selectedOrder.id}/report`, {
        notes,
        impression,
        version: selectedOrder.version,
      });
      showToast('success', 'Radiology Report Finalized', 'Imaging findings saved & attending doctor notified.');
      setIsReportModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Report Submission Failed', err.response?.data?.message || err.message);
    }
  };

  const patientOptions: Option[] = patients.map((p) => ({
    value: p.id,
    label: p.fullName,
    subLabel: `${p.mrn} • DOB: ${p.dateOfBirth}`,
  }));

  const commonModalities = [
    { name: 'Chest X-Ray Digital View (PA/AP)', modality: 'X-Ray', cost: 85.0 },
    { name: 'Abdominal & Pelvic Ultrasound Scan', modality: 'Ultrasound USG', cost: 120.0 },
    { name: 'Brain CT Scan Non-Contrast', modality: 'CT Scan', cost: 280.0 },
    { name: 'Lumbosacral Spine MRI', modality: 'MRI', cost: 450.0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Radiology & Diagnostic Imaging (RIS / PACS)</h2>
          <p className="text-xs text-slate-400">Modality order entry (X-Ray, USG, CT, MRI) and radiologist reporting</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={orders} filename="hms_radiology_orders" />
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Order Imaging
          </button>
        </div>
      </div>

      {/* Orders Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Order #</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">Modality</th>
              <th className="p-4">Procedure Requested</th>
              <th className="p-4">Status</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {orders.map((ord) => (
              <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-mono font-bold text-cyan-400">{ord.orderNumber}</td>
                <td className="p-4 font-medium text-white">{ord.patientName}</td>
                <td className="p-4 font-mono text-xs text-purple-300 font-bold">{ord.modality}</td>
                <td className="p-4 text-slate-200">{ord.procedureName}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      ord.status === 'REPORTED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {ord.status}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-500">v{ord.version}</td>
                <td className="p-4 text-right space-x-2">
                  {ord.status !== 'REPORTED' ? (
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setNotes(ord.radiologistNotes || '');
                        setImpression(ord.impression || '');
                        setIsReportModalOpen(true);
                      }}
                      className="p-1.5 bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Film className="w-3.5 h-3.5" />
                      Submit Report
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setIsPrintModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-cyan-400" />
                      Print Report
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Imaging Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsOrderModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Order Diagnostic Imaging</h3>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <SearchableSelect
                  label="Select Patient (Searchable)"
                  options={patientOptions}
                  value={orderForm.patientId}
                  onChange={(val) => setOrderForm({ ...orderForm, patientId: val })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Imaging Modality</label>
                  <select
                    value={orderForm.modality}
                    onChange={(e) => setOrderForm({ ...orderForm, modality: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    <option value="X-Ray">X-Ray</option>
                    <option value="Ultrasound USG">Ultrasound USG</option>
                    <option value="CT Scan">CT Scan</option>
                    <option value="MRI">MRI</option>
                    <option value="Mammography">Mammography</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Fee ({formatCurrency(orderForm.cost)})</label>
                  <input
                    type="number"
                    value={orderForm.cost}
                    onChange={(e) => setOrderForm({ ...orderForm, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Procedure Name</label>
                <input
                  type="text"
                  required
                  value={orderForm.procedureName}
                  onChange={(e) => setOrderForm({ ...orderForm, procedureName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950"
                >
                  Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Radiologist Report Entry Modal */}
      {isReportModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsReportModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Radiology Diagnostic Findings</h3>
            <p className="text-xs text-slate-400 mb-4">Patient: {selectedOrder.patientName} • {selectedOrder.procedureName}</p>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Radiological Findings & Description</label>
                <textarea
                  rows={4}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Normal cardiac silhouette and lung fields. Bronchovascular structures intact..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Diagnostic Impression</label>
                <input
                  type="text"
                  required
                  value={impression}
                  onChange={(e) => setImpression(e.target.value)}
                  placeholder="e.g. Unremarkable Chest Radiograph"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950"
                >
                  Sign & Finalize Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {isPrintModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsPrintModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white print:hidden">
              <X className="w-5 h-5" />
            </button>

            <div id="printable-receipt" className="space-y-4 text-slate-100">
              <div className="text-center pb-3 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">{clinicName}</h2>
                <p className="text-xs text-slate-400">Department of Diagnostic Radiology & Imaging</p>
                <p className="text-[11px] font-mono text-cyan-400 mt-1">Order #: {selectedOrder.orderNumber}</p>
              </div>

              <div className="flex justify-between text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block">Patient Name:</span>
                  <span className="font-bold text-white">{selectedOrder.patientName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Modality:</span>
                  <span className="font-mono text-purple-400 font-bold">{selectedOrder.modality}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                <strong className="text-cyan-300 block font-bold">Procedure: {selectedOrder.procedureName}</strong>
                <p className="text-slate-300"><strong>Findings:</strong> {selectedOrder.radiologistNotes}</p>
                <p className="text-emerald-400 font-bold"><strong>Impression:</strong> {selectedOrder.impression}</p>
              </div>

              <div className="text-[11px] text-slate-500 text-right">
                Reported by: <span className="text-slate-300 font-semibold">{selectedOrder.reportedBy}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
