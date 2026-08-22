import React, { useEffect, useState } from 'react';
import { Building2, Plus, ShieldCheck, CheckCircle2, X, Activity, DollarSign, Globe, Lock, Power, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const TenantManagementView: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [editingTenant, setEditingTenant] = useState<any>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: '',
    subdomain: '',
    currency: 'USD',
    plan: 'PROFESSIONAL',
    maxUsers: 50,
    contactEmail: '',
    contactPhone: '',
  });

  const [editForm, setEditForm] = useState({
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
      await api.post('/tenants', createForm);
      showToast('success', 'Tenant Provisioned', `Hospital tenant '${createForm.name}' created on subdomain '${createForm.subdomain}'`);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', subdomain: '', currency: 'USD', plan: 'PROFESSIONAL', maxUsers: 50, contactEmail: '', contactPhone: '' });
      fetchTenants();
    } catch (err: any) {
      showToast('error', 'Tenant Provisioning Failed', err.response?.data?.message || err.message);
    }
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      await api.put(`/tenants/${editingTenant.id}`, editForm);
      showToast('success', 'Tenant Updated', `Workspace '${editForm.name}' configuration updated.`);
      setIsEditModalOpen(false);
      setEditingTenant(null);
      fetchTenants();
    } catch (err: any) {
      showToast('error', 'Tenant Update Failed', err.response?.data?.message || err.message);
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

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete hospital workspace '${name}'?`)) return;
    try {
      await api.delete(`/tenants/${id}`);
      showToast('success', 'Tenant Deleted', 'Workspace removed');
      fetchTenants();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.message || err.message);
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
          <p className="text-xs text-slate-400">Full CRUD for provisioned hospital workspaces, custom subdomains, system currency & user limits</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={tenants} filename="hms_tenants_master" />
          <button
            onClick={() => setIsCreateModalOpen(true)}
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
              <th className="p-4">Subdomain Access URL</th>
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
                <td className="p-4 font-mono text-xs text-cyan-400">
                  <a
                    href={`http://${t.subdomain}.localhost:5178`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:underline text-cyan-400 font-bold"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{t.subdomain}.clinic.com</span>
                  </a>
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
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditingTenant(t);
                      setEditForm({
                        name: t.name,
                        subdomain: t.subdomain,
                        currency: t.currency || 'USD',
                        plan: t.plan || 'PROFESSIONAL',
                        maxUsers: t.maxUsers || 50,
                        contactEmail: t.contactEmail || '',
                        contactPhone: t.contactPhone || '',
                      });
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold"
                    title="Edit Workspace Settings"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(t.id, t.status)}
                    className={`p-1.5 rounded-lg text-xs font-semibold border ${
                      t.status === 'ACTIVE'
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-500/30'
                    }`}
                    title={t.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteTenant(t.id, t.name)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-semibold"
                    title="Delete Tenant Workspace"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Onboard Tenant Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
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
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
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
                    value={createForm.subdomain}
                    onChange={(e) => setCreateForm({ ...createForm, subdomain: e.target.value })}
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
                    value={createForm.currency}
                    onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
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
                    value={createForm.plan}
                    onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value as any })}
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
                    value={createForm.maxUsers}
                    onChange={(e) => setCreateForm({ ...createForm, maxUsers: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="admin@tenant.com"
                    value={createForm.contactEmail}
                    onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
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
                  Provision Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Edit Hospital Tenant Settings</h3>

            <form onSubmit={handleEditTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Hospital / Clinic Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Subdomain Identifier</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    value={editForm.subdomain}
                    onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value })}
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
                    value={editForm.currency}
                    onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
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
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as any })}
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
                    value={editForm.maxUsers}
                    onChange={(e) => setEditForm({ ...editForm, maxUsers: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={editForm.contactEmail}
                    onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg"
                >
                  Save Workspace Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
