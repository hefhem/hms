import React, { useEffect, useState } from 'react';
import { ReceiptText, Plus, Search, Edit, ToggleLeft, ToggleRight, X, Check } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const ServicesView: React.FC = () => {
  const [services, setServices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const { formatCurrency, currencyCode } = useSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    code: 'SRV-NEW-01',
    name: '',
    category: 'Consultation',
    price: 50.0,
    taxRate: 0.0,
  });

  useEffect(() => {
    fetchServices();
  }, [search, selectedCategory]);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services', {
        params: { search, category: selectedCategory || undefined },
      });
      setServices(res.data);
    } catch (err: any) {
      showToast('error', 'Error Loading Price List', err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.put(`/services/${editingService.id}`, {
          ...form,
          version: editingService.version,
        });
        showToast('success', 'Price List Updated', `Master item ${form.code} updated.`);
      } else {
        await api.post('/services', form);
        showToast('success', 'Service Master Created', `Service ${form.code} added to official price list.`);
      }
      setIsModalOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (err: any) {
      showToast('error', 'Save Failed', err.response?.data?.message || err.message);
    }
  };

  const handleToggleActive = async (service: any) => {
    try {
      await api.put(`/services/${service.id}`, {
        isActive: !service.isActive,
        version: service.version,
      });
      showToast('success', 'Status Toggled', `${service.name} is now ${!service.isActive ? 'Active' : 'Inactive'}`);
      fetchServices();
    } catch (err: any) {
      showToast('error', 'Toggle Failed', err.response?.data?.message || err.message);
    }
  };

  const categories = ['Consultation', 'Laboratory', 'Radiology', 'Procedure', 'Nursing Care', 'Administrative'];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search service name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <ExportOptions data={services} filename="hms_service_price_list" label="Export Price List" />
          <button
            onClick={() => {
              setEditingService(null);
              setForm({
                code: `SRV-CUST-${Math.floor(100 + Math.random() * 900)}`,
                name: '',
                category: 'Consultation',
                price: 50.0,
                taxRate: 0.0,
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Service Master
          </button>
        </div>
      </div>

      {/* Services Price List Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Service Code</th>
              <th className="p-4">Service Description</th>
              <th className="p-4">Category</th>
              <th className="p-4">Master Base Price ({currencyCode})</th>
              <th className="p-4">Tax Rate</th>
              <th className="p-4">Status</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {services.map((srv) => (
              <tr key={srv.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-mono font-bold text-cyan-400">{srv.code}</td>
                <td className="p-4 font-semibold text-white">{srv.name}</td>
                <td className="p-4 text-slate-400 text-xs">{srv.category}</td>
                <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(srv.price)}</td>
                <td className="p-4 font-mono text-xs text-slate-400">{srv.taxRate}%</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      srv.isActive
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {srv.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-500">v{srv.version}</td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => handleToggleActive(srv)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                    title={srv.isActive ? 'Deactivate Service' : 'Activate Service'}
                  >
                    {srv.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingService(srv);
                      setForm({
                        code: srv.code,
                        name: srv.name,
                        category: srv.category,
                        price: srv.price,
                        taxRate: srv.taxRate,
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg"
                    title="Edit Service Master Price"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Service Master Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingService ? 'Edit Service Price Master' : 'Add New Service Master'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Standardized hospital price list item</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Service Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingService}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Service Description Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Chest X-Ray Digital View"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Standard Price ({currencyCode})</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950"
                >
                  Save Service Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
