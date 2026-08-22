import React, { useEffect, useState } from 'react';
import { TestTube, FlaskConical, Plus, CheckCircle2, AlertTriangle, Printer, Barcode, X, FileText } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const LabView: React.FC = () => {
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { formatCurrency, clinicName } = useSettings();
  const { showToast } = useToast();

  // Order Form
  const [orderForm, setOrderForm] = useState({
    patientId: '',
    testName: 'Complete Blood Count (CBC Panel)',
    specimenType: 'Venous Blood',
    cost: 50.0,
  });

  // Result Entry Form
  const [parameters, setParameters] = useState<any[]>([
    { parameter: 'Hemoglobin', value: '14.2', unit: 'g/dL', referenceRange: '13.5 - 17.5', isAbnormal: false },
    { parameter: 'White Blood Cell (WBC)', value: '6.8', unit: 'x10^3/uL', referenceRange: '4.5 - 11.0', isAbnormal: false },
    { parameter: 'Platelets', value: '250', unit: 'x10^3/uL', referenceRange: '150 - 450', isAbnormal: false },
  ]);
  const [labNotes, setLabNotes] = useState('All cellular elements within normal clinical reference boundaries.');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orderRes, patRes] = await Promise.all([api.get('/lab/orders'), api.get('/patients')]);
      setLabOrders(orderRes.data);
      setPatients(patRes.data);
      if (patRes.data.length > 0) {
        setOrderForm((prev) => ({ ...prev, patientId: patRes.data[0].id }));
      }
    } catch (err: any) {
      showToast('error', 'Error Loading LIS Data', err.message);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/lab/orders', orderForm);
      showToast('success', 'Lab Test Ordered', 'Sample barcode generated & invoice added to billing queue.');
      setIsOrderModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Order Failed', err.response?.data?.message || err.message);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, version: number) => {
    try {
      await api.put(`/lab/orders/${id}/status`, { status, version });
      showToast('success', 'Sample Status Updated', `Order progressed to ${status}`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Status Update Failed', err.response?.data?.message || err.message);
    }
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await api.put(`/lab/orders/${selectedOrder.id}/results`, {
        testParameters: parameters,
        labNotes,
        version: selectedOrder.version,
      });
      showToast('success', 'Lab Test Resulted', 'Parameters saved & abnormal flags verified.');
      setIsResultModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Result Submission Failed', err.response?.data?.message || err.message);
    }
  };

  const commonTestPanels = [
    { name: 'Complete Blood Count (CBC Panel)', specimen: 'Venous Blood', cost: 50.0 },
    { name: 'Lipid Profile Panel', specimen: 'Fasting Blood', cost: 65.0 },
    { name: 'Comprehensive Metabolic Panel (CMP)', specimen: 'Serum', cost: 80.0 },
    { name: 'Urinalysis Routine', specimen: 'Midstream Urine', cost: 30.0 },
    { name: 'Thyroid Function Test (TSH, T3, T4)', specimen: 'Serum', cost: 75.0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Laboratory Information System (LIS)</h2>
          <p className="text-xs text-slate-400">Specimen tracking, barcode generation, and result reporting</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={labOrders} filename="hms_laboratory_orders" />
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Order Lab Test
          </button>
        </div>
      </div>

      {/* Lab Orders Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Order #</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">Test Requested</th>
              <th className="p-4">Specimen & Barcode</th>
              <th className="p-4">Status</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {labOrders.map((ord) => (
              <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-mono font-bold text-cyan-400">{ord.orderNumber}</td>
                <td className="p-4 font-medium text-white">{ord.patientName}</td>
                <td className="p-4 font-semibold text-slate-200">{ord.testName}</td>
                <td className="p-4 text-xs font-mono text-slate-400">
                  {ord.specimenType}
                  <span className="block text-[10px] text-amber-400 font-bold mt-0.5">🏷️ {ord.sampleBarcode}</span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      ord.status === 'RESULTED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : ord.status === 'SAMPLE_COLLECTED'
                        ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {ord.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-500">v{ord.version}</td>
                <td className="p-4 text-right space-x-2">
                  {ord.status === 'ORDERED' && (
                    <button
                      onClick={() => handleUpdateStatus(ord.id, 'SAMPLE_COLLECTED', ord.version)}
                      className="p-1.5 bg-blue-950 border border-blue-500/30 text-blue-300 hover:bg-blue-900 rounded-lg text-xs font-semibold"
                    >
                      Collect Specimen
                    </button>
                  )}
                  {ord.status === 'SAMPLE_COLLECTED' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setIsResultModalOpen(true);
                      }}
                      className="p-1.5 bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <TestTube className="w-3.5 h-3.5" />
                      Enter Parameters
                    </button>
                  )}
                  {ord.status === 'RESULTED' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setIsPrintModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-cyan-400" />
                      Report PDF
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Lab Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsOrderModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Order Laboratory Investigation</h3>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Patient</label>
                <select
                  required
                  value={orderForm.patientId}
                  onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Lab Test Panel Name</label>
                <input
                  type="text"
                  required
                  value={orderForm.testName}
                  onChange={(e) => setOrderForm({ ...orderForm, testName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {commonTestPanels.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        setOrderForm({ ...orderForm, testName: p.name, specimenType: p.specimen, cost: p.cost })
                      }
                      className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 rounded"
                    >
                      + {p.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Specimen Type</label>
                  <input
                    type="text"
                    required
                    value={orderForm.specimenType}
                    onChange={(e) => setOrderForm({ ...orderForm, specimenType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Test Cost</label>
                  <input
                    type="number"
                    required
                    value={orderForm.cost}
                    onChange={(e) => setOrderForm({ ...orderForm, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
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
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enter Test Parameters Result Modal */}
      {isResultModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsResultModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Enter Laboratory Test Results</h3>
            <p className="text-xs text-slate-400 mb-4">
              Patient: {selectedOrder.patientName} • Test: {selectedOrder.testName}
            </p>

            <form onSubmit={handleSaveResults} className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {parameters.map((param, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center">
                    <input
                      type="text"
                      placeholder="Parameter"
                      value={param.parameter}
                      onChange={(e) => {
                        const updated = [...parameters];
                        updated[index].parameter = e.target.value;
                        setParameters(updated);
                      }}
                      className="col-span-4 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Result Value"
                      value={param.value}
                      onChange={(e) => {
                        const updated = [...parameters];
                        updated[index].value = e.target.value;
                        setParameters(updated);
                      }}
                      className="col-span-3 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-cyan-300 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={param.unit}
                      onChange={(e) => {
                        const updated = [...parameters];
                        updated[index].unit = e.target.value;
                        setParameters(updated);
                      }}
                      className="col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300"
                    />
                    <input
                      type="text"
                      placeholder="Ref Range"
                      value={param.referenceRange}
                      onChange={(e) => {
                        const updated = [...parameters];
                        updated[index].referenceRange = e.target.value;
                        setParameters(updated);
                      }}
                      className="col-span-3 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Clinical Remarks & Notes</label>
                <textarea
                  rows={2}
                  value={labNotes}
                  onChange={(e) => setLabNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResultModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950"
                >
                  Finalize & Sign Lab Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable Lab Report PDF Modal */}
      {isPrintModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsPrintModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white print:hidden">
              <X className="w-5 h-5" />
            </button>

            <div id="printable-receipt" className="space-y-4 text-slate-100">
              <div className="text-center pb-3 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">{clinicName}</h2>
                <p className="text-xs text-slate-400">Department of Pathology & Clinical Laboratory</p>
                <p className="text-[11px] font-mono text-cyan-400 mt-1">Lab Order #: {selectedOrder.orderNumber}</p>
              </div>

              <div className="flex justify-between text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block">Patient Name:</span>
                  <span className="font-bold text-white">{selectedOrder.patientName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Specimen Barcode:</span>
                  <span className="font-mono text-amber-400 font-bold">{selectedOrder.sampleBarcode}</span>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Parameter</th>
                      <th className="p-2.5">Result</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5 text-right">Reference Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {selectedOrder.testParameters?.map((param: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-white">{param.parameter}</td>
                        <td className="p-2.5 font-bold text-cyan-300">{param.value}</td>
                        <td className="p-2.5 text-slate-400">{param.unit}</td>
                        <td className="p-2.5 text-right font-mono text-slate-400">{param.referenceRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedOrder.labNotes && (
                <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <strong className="text-slate-400 block mb-1">Pathologist Remarks:</strong>
                  {selectedOrder.labNotes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF Lab Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
