import React, { useEffect, useState } from 'react';
import { Building2, Plus, ShieldCheck, CheckCircle2, X, Activity, DollarSign, Globe, Lock, Power } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const TenantManagementView: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    currency: 'USD',
    plan: 'PROFESSIONAL',
    maxUsers: 50,
    contactEmail: '',
    contactPhone: '',
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants');
      setTenants(res.data);
    } catch (err: any) {
      showToast('error', 'Error Loading Tenants', err.message);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tenants', formData);
      showToast('success', 'Tenant Onboarded', `Hospital tenant '${formData.name}' created on subdomain '${formData.subdomain}'`);
      setIsModalOpen(false);
      setFormData({ name: '', subdomain: '', currency: 'USD', plan: 'PROFESSIONAL', maxUsers: 50, contactEmail: '', contactPhone: '' });
      fetchTenants();
    } catch (err: any) {
      showToast('error', 'Tenant Onboarding Failed', err.response?.data?.message || err.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.put(`/tenants/${id}/status`, { status: newStatus });
      showToast('success', 'Tenant Status Updated', `Tenant status set to ${newStatus}`);
      fetchTenants();
    } catch (err: any) {
      showToast('error', 'Status Update Failed', err.response?.data?.message || err.message);
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE':
        return 'bg-purple-950 text-purple-300 border-purple-500/40';
      case 'PROFESSIONAL':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Multi-Tenant Platform & Hospital Workspace Management</h2>
          <p className="text-xs text-slate-400">Provision isolated hospital/clinic workspaces, configure currency, tier plans & user quotas</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={tenants} filename="hms_tenants_master" />
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Provision New Tenant Workspace
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Hospital Tenant Name</th>
              <th className="p-4">Subdomain Identifier</th>
              <th className="p-4">System Currency</th>
              <th className="p-4">Subscription Tier</th>
              <th className="p-4">User Quota</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block">{t.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{t.contactEmail || 'No contact email'}</span>
                  </div>
                </td>
                <td className="p-4 font-mono text-xs text-cyan-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t.subdomain}.clinic.com</span>
                </td>
                <td className="p-4 font-mono text-xs font-bold text-emerald-400">{t.currency}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getPlanBadge(t.plan)}`}>
                    {t.plan}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-300">{t.maxUsers} Users</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      t.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleToggleStatus(t.id, t.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto transition-all ${
                      t.status === 'ACTIVE'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {t.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Onboard Tenant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Provision Hospital Tenant Workspace</h3>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Hospital / Clinic Name</label>
                <input
                  type="text"
                  required
                  placeholder="ApexCare Medical Center"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Subdomain Identifier</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="apexcare"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-l-xl text-sm text-white font-mono"
                  />
                  <span className="px-3 py-2 bg-slate-800 border border-l-0 border-slate-700 rounded-r-xl text-xs text-slate-400 font-mono">
                    .clinic.com
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">System Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="NGN">NGN (₦)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Subscription Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="PROFESSIONAL">PROFESSIONAL</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Max User Quota</label>
                  <input
                    type="number"
                    required
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="admin@tenant.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
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
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
