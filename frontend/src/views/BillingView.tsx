import React, { useEffect, useState } from 'react';
import { CreditCard, DollarSign, Printer, CheckCircle2, Clock, Plus, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const BillingView: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [masterServices, setMasterServices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const { formatCurrency, currencyCode, clinicName } = useSettings();

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'INSURANCE' | 'BANK_TRANSFER'>('CASH');

  // Manual Invoice Creation State
  const [newInvoiceData, setNewInvoiceData] = useState({
    patientId: '',
    discount: 0,
    notes: '',
    lineItems: [
      { serviceCode: 'SRV-CONS-GEN', description: 'General Doctor Consultation Fee', unitPrice: 50.0, quantity: 1, total: 50.0 },
    ],
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, patRes, srvRes] = await Promise.all([
        api.get('/billing/invoices'),
        api.get('/patients'),
        api.get('/services', { params: { isActive: true } }),
      ]);
      setInvoices(invRes.data);
      setPatients(patRes.data);
      setMasterServices(srvRes.data);
      if (patRes.data.length > 0) {
        setNewInvoiceData((prev) => ({ ...prev, patientId: patRes.data[0].id }));
      }
    } catch (err: any) {
      showToast('error', 'Error Loading Invoices', err.message);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return;
    try {
      await api.put(`/billing/invoices/${selectedInvoice.id}/pay`, {
        paymentMethod,
        version: selectedInvoice.version,
      });
      showToast('success', 'Payment Settled', `Invoice ${selectedInvoice.invoiceNumber} paid via ${paymentMethod}`);
      setIsPayModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Payment Failed', err.response?.data?.message || err.message);
    }
  };

  const addLineItemFromCatalog = (serviceId: string) => {
    const srv = masterServices.find((s) => s.id === serviceId);
    if (!srv) return;

    setNewInvoiceData({
      ...newInvoiceData,
      lineItems: [
        ...newInvoiceData.lineItems,
        { serviceCode: srv.code, description: srv.name, unitPrice: srv.price, quantity: 1, total: srv.price },
      ],
    });
  };

  const removeLineItem = (index: number) => {
    setNewInvoiceData({
      ...newInvoiceData,
      lineItems: newInvoiceData.lineItems.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const updated = [...newInvoiceData.lineItems];
    const item = { ...updated[index], [field]: value };
    item.total = item.unitPrice * item.quantity;
    updated[index] = item;
    setNewInvoiceData({ ...newInvoiceData, lineItems: updated });
  };

  const calculateSubtotal = () => {
    return newInvoiceData.lineItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoiceData.patientId) {
      showToast('warning', 'Missing Patient', 'Please select a patient for this invoice.');
      return;
    }
    if (newInvoiceData.lineItems.length === 0) {
      showToast('warning', 'Missing Line Items', 'Please select at least one service item from the catalog.');
      return;
    }

    try {
      await api.post('/billing/invoices', newInvoiceData);
      showToast('success', 'Invoice Drafted', 'Master service invoice generated and patient notified via Email SMTP.');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Creation Failed', err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Billing & Financial Invoices ({currencyCode})</h2>
          <p className="text-xs text-slate-400">Payment settlement & printable medical receipts</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={invoices} filename="hms_billing_invoices" />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Custom Invoice
          </button>
        </div>
      </div>

      {/* Invoices Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Invoice #</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Payment Method</th>
              <th className="p-4">Status</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-mono font-bold text-cyan-400">{inv.invoiceNumber}</td>
                <td className="p-4 font-medium text-white">{inv.patientName}</td>
                <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(inv.finalAmount)}</td>
                <td className="p-4 text-xs font-mono text-slate-400">{inv.paymentMethod}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      inv.paymentStatus === 'PAID'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {inv.paymentStatus}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-500">v{inv.version}</td>
                <td className="p-4 text-right space-x-2">
                  {inv.paymentStatus !== 'PAID' ? (
                    <button
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsPayModalOpen(true);
                      }}
                      className="p-1.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Collect Payment
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsPrintModalOpen(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-cyan-400" />
                      Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Invoice Creation Modal with Service Price List Selector */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Create Invoice from Master Price List</h3>
            <p className="text-xs text-slate-400 mb-4">Select standardized services from the hospital Charge Master catalog</p>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Patient</label>
                <select
                  required
                  value={newInvoiceData.patientId}
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, patientId: e.target.value })}
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

              {/* Service Master Picker Dropdown */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-cyan-400 uppercase">
                  + Add Item from Service Master Catalog
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addLineItemFromCatalog(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="">-- Choose Service from Price List --</option>
                  {masterServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      [{srv.category}] {srv.name} ({formatCurrency(srv.price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Items List */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase">Selected Billable Items</label>

                {newInvoiceData.lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center">
                    <div className="col-span-6">
                      <span className="font-bold text-white text-xs block">{item.description}</span>
                      {item.serviceCode && <span className="font-mono text-[10px] text-cyan-400">{item.serviceCode}</span>}
                    </div>
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="col-span-3 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="col-span-2 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="col-span-1 text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Discount Amount ({currencyCode})</label>
                  <input
                    type="number"
                    value={newInvoiceData.discount}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, discount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Final Total</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {formatCurrency(Math.max(0, calculateSubtotal() - newInvoiceData.discount))}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {isPayModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsPayModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Process Payment</h3>
            <p className="text-xs text-slate-400 mb-4">
              Invoice {selectedInvoice.invoiceNumber} - {formatCurrency(selectedInvoice.finalAmount)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['CASH', 'CARD', 'INSURANCE', 'BANK_TRANSFER'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                        paymentMethod === method
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-950'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {method.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950"
                >
                  Confirm Settle Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {isPrintModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsPrintModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white print:hidden">
              <X className="w-5 h-5" />
            </button>

            {/* Printable Receipt Container */}
            <div id="printable-receipt" className="space-y-4 text-slate-100">
              <div className="text-center pb-3 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">{clinicName}</h2>
                <p className="text-xs text-slate-400">Official Payment Receipt & Tax Invoice</p>
                <p className="text-[11px] font-mono text-cyan-400 mt-1">Invoice #: {selectedInvoice.invoiceNumber}</p>
              </div>

              <div className="flex justify-between text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block">Patient Name:</span>
                  <span className="font-bold text-white">{selectedInvoice.patientName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Date Paid:</span>
                  <span className="font-mono">{new Date(selectedInvoice.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {selectedInvoice.lineItems?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-white">{item.description}</td>
                        <td className="p-2.5">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-400">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2 font-bold text-sm">
                <span>Total Amount Paid ({selectedInvoice.paymentMethod}):</span>
                <span className="text-emerald-400 font-mono text-lg">{formatCurrency(selectedInvoice.finalAmount)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
