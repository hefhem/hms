import React, { useEffect, useState } from 'react';
import { Building2, Plus, ShieldCheck, CheckCircle2, X, Activity, DollarSign, Globe, Lock, Power, Edit2, Trash2, Mail, Users, Server } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const TenantManagementView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workspaces' | 'users' | 'smtp'>('workspaces');

  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [configuringSmtpTenant, setConfiguringSmtpTenant] = useState<any>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    name: '',
    subdomain: '',
    currency: 'USD',
    plan: 'PROFESSIONAL',
    maxUsers: 50,
    contactEmail: '',
    contactPhone: '',
    smtpHost: 'localhost',
    smtpPort: 1025,
    senderEmail: 'notifications@clinic.com',
    senderName: 'ApexCare HMS',
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

  const [smtpForm, setSmtpForm] = useState({
    smtpHost: 'localhost',
    smtpPort: 1025,
    smtpUser: '',
    smtpPassword: '',
    senderEmail: 'notifications@clinic.com',
    senderName: 'Care Team',
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        api.get('/tenants'),
        api.get('/users'),
      ]);
      setTenants(tRes.data);
      setUsers(uRes.data);
    } catch (err: any) {
      showToast('error', 'Error Loading SaaS Platform Data', err.message);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tenants', createForm);
      showToast('success', 'Tenant Provisioned', `Hospital workspace '${createForm.name}' created on '${createForm.subdomain}.clinic.com'`);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', subdomain: '', currency: 'USD', plan: 'PROFESSIONAL', maxUsers: 50, contactEmail: '', contactPhone: '', smtpHost: 'localhost', smtpPort: 1025, senderEmail: 'notifications@clinic.com', senderName: 'ApexCare HMS' });
      fetchData();
    } catch (err: any) {
      showToast('error', 'Tenant Provisioning Failed', err.response?.data?.message || err.message);
    }
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      await api.put(`/tenants/${editingTenant.id}`, editForm);
      showToast('success', 'Workspace Updated', `Updated details for ${editForm.name}`);
      setIsEditModalOpen(false);
      setEditingTenant(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.response?.data?.message || err.message);
    }
  };

  const handleSaveSmtpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringSmtpTenant) return;
    try {
      await api.put(`/tenants/${configuringSmtpTenant.id}/smtp`, smtpForm);
      showToast('success', 'SMTP Gateway Configured', `Updated SMTP mail settings for ${configuringSmtpTenant.name}`);
      setIsSmtpModalOpen(false);
      setConfiguringSmtpTenant(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'SMTP Save Failed', err.response?.data?.message || err.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.put(`/tenants/${id}/status`, { status: newStatus });
      showToast('success', 'Status Updated', `Workspace status set to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Status Update Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete hospital workspace '${name}'?`)) return;
    try {
      await api.delete(`/tenants/${id}`);
      showToast('success', 'Tenant Deleted', 'Workspace removed');
      fetchData();
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
          <h2 className="text-lg font-bold text-white">Dedicated Multi-Tenant SaaS Platform Portal</h2>
          <p className="text-xs text-slate-400">Hospital Workspaces, Cross-Tenant Staff Management & Dedicated Per-Tenant SMTP Mail Gateways</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={tenants} filename="hms_multi_tenant_catalog" />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Provision Hospital Tenant
          </button>
        </div>
      </div>

      {/* Portal Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('workspaces')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'workspaces'
              ? 'bg-purple-950 text-purple-300 border border-purple-500/40 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-400" />
          Hospital Workspaces ({tenants.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          Cross-Tenant Staff ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'smtp'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-400" />
          Per-Tenant SMTP Mail Gateways ({tenants.length})
        </button>
      </div>

      {/* TAB 1: HOSPITAL WORKSPACES */}
      {activeTab === 'workspaces' && (
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
                      title="Edit Workspace"
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
      )}

      {/* TAB 2: CROSS-TENANT STAFF USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Global Cross-Tenant Staff Account Directory</h3>
            <ExportOptions data={users} filename="hms_global_staff_directory" />
          </div>
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Staff Member Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white">{u.fullName}</td>
                  <td className="p-4 font-mono text-xs text-cyan-400">{u.email}</td>
                  <td className="p-4 font-mono text-xs text-purple-300 font-bold">{u.role}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${u.isActive !== false ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300 border border-rose-500/30'}`}>
                      {u.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PER-TENANT SMTP MAIL GATEWAYS */}
      {activeTab === 'smtp' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Per-Tenant Dedicated SMTP Email Gateway Configurations</h3>
            <ExportOptions data={tenants} filename="hms_tenant_smtp_gateways" />
          </div>
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Hospital Tenant</th>
                <th className="p-4">SMTP Relay Server</th>
                <th className="p-4">Port</th>
                <th className="p-4">Sender Email</th>
                <th className="p-4">Sender Name</th>
                <th className="p-4 text-right">Configure SMTP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-bold text-white">{t.name}</td>
                  <td className="p-4 font-mono text-xs text-cyan-400">{t.smtpHost || 'localhost'}</td>
                  <td className="p-4 font-mono text-xs text-emerald-400">{t.smtpPort || 1025}</td>
                  <td className="p-4 font-mono text-xs text-slate-300">{t.senderEmail || 'notifications@clinic.com'}</td>
                  <td className="p-4 text-xs font-bold text-purple-300">{t.senderName || 'Hospital Care Team'}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setConfiguringSmtpTenant(t);
                        setSmtpForm({
                          smtpHost: t.smtpHost || 'localhost',
                          smtpPort: t.smtpPort || 1025,
                          smtpUser: t.smtpUser || '',
                          smtpPassword: t.smtpPassword || '',
                          senderEmail: t.senderEmail || `notifications@${t.subdomain}.clinic.com`,
                          senderName: t.senderName || `${t.name} Notifications`,
                        });
                        setIsSmtpModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-950 border border-emerald-500/30 hover:bg-emerald-900 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto"
                    >
                      <Server className="w-3.5 h-3.5" />
                      Configure SMTP Server
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provision Tenant Modal */}
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
                  placeholder="St. Nicholas Hospital"
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
                    placeholder="stnicholas"
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
                    <option value="NGN">NGN (₦)</option>
                    <option value="EUR">EUR (€)</option>
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
                    placeholder="info@stnicholas.com"
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
            <h3 className="text-lg font-bold text-white mb-4">Edit Hospital Workspace</h3>

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
                    <option value="NGN">NGN (₦)</option>
                    <option value="EUR">EUR (€)</option>
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

      {/* Per-Tenant SMTP Configuration Modal */}
      {isSmtpModalOpen && configuringSmtpTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsSmtpModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Server className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Configure Per-Tenant SMTP Mail Gateway</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Dedicated outbound SMTP credentials for <strong>{configuringSmtpTenant.name}</strong></p>

            <form onSubmit={handleSaveSmtpConfig} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SMTP Relay Host</label>
                  <input
                    type="text"
                    required
                    placeholder="smtp.stnicholas.com"
                    value={smtpForm.smtpHost}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtpHost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Port</label>
                  <input
                    type="number"
                    required
                    value={smtpForm.smtpPort}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtpPort: parseInt(e.target.value) || 587 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SMTP Username</label>
                  <input
                    type="text"
                    placeholder="smtp_user"
                    value={smtpForm.smtpUser}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtpUser: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SMTP Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={smtpForm.smtpPassword}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtpPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Outbound Sender Email</label>
                  <input
                    type="email"
                    required
                    value={smtpForm.senderEmail}
                    onChange={(e) => setSmtpForm({ ...smtpForm, senderEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Outbound Sender Name</label>
                  <input
                    type="text"
                    required
                    value={smtpForm.senderName}
                    onChange={(e) => setSmtpForm({ ...smtpForm, senderName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSmtpModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg"
                >
                  Save SMTP Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
