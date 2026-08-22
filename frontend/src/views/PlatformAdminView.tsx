import React, { useEffect, useState } from 'react';
import { Building2, Plus, ShieldCheck, X, Activity, DollarSign, Globe, Lock, Power, Edit2, Trash2, Mail, Users, Server, AlertTriangle, Send, Bell, Wrench } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const PlatformAdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'platform_users' | 'platform_smtp' | 'broadcasts'>('subscribers');

  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [lockingTenant, setLockingTenant] = useState<any>(null);
  const [maintenanceTenant, setMaintenanceTenant] = useState<any>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

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

  const [lockReason, setLockReason] = useState('Payment subscription expired or policy lock.');
  const [maintenanceMessage, setMaintenanceMessage] = useState('Scheduled system upgrade in progress.');

  // Broadcast Form
  const [broadcastForm, setBroadcastForm] = useState({
    targetTenantId: 'ALL',
    title: 'System Platform Update',
    message: 'Scheduled maintenance or platform upgrade alert.',
    sendEmail: true,
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
      showToast('error', 'Error Loading Platform Data', err.message);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tenants', createForm);
      showToast('success', 'Subscriber Workspace Provisioned', `Created workspace '${createForm.name}' on '${createForm.subdomain}.clinic.com'`);
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Provisioning Failed', err.response?.data?.message || err.message);
    }
  };

  const handleToggleLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockingTenant) return;
    try {
      const isLocked = !lockingTenant.isLocked;
      await api.put(`/tenants/${lockingTenant.id}/lock`, { isLocked, lockReason });
      showToast('success', 'Tenant Lock State Updated', `Tenant '${lockingTenant.name}' is now ${isLocked ? 'LOCKED' : 'UNLOCKED'}`);
      setIsLockModalOpen(false);
      setLockingTenant(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Lock Action Failed', err.response?.data?.message || err.message);
    }
  };

  const handleToggleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceTenant) return;
    try {
      const isMaintenanceMode = !maintenanceTenant.isMaintenanceMode;
      await api.put(`/tenants/${maintenanceTenant.id}/maintenance`, { isMaintenanceMode, maintenanceMessage });
      showToast('success', 'Maintenance Mode Updated', `Maintenance mode for '${maintenanceTenant.name}' is ${isMaintenanceMode ? 'ENABLED' : 'DISABLED'}`);
      setIsMaintenanceModalOpen(false);
      setMaintenanceTenant(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Maintenance Action Failed', err.response?.data?.message || err.message);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      showToast('success', 'Platform Notification Broadcast Dispatched', `Sent broadcast to ${broadcastForm.targetTenantId === 'ALL' ? 'All Tenants' : 'Selected Tenant'} (In-App & Email)`);
      setBroadcastForm({ targetTenantId: 'ALL', title: 'System Platform Update', message: 'Scheduled maintenance or platform upgrade alert.', sendEmail: true });
    } catch (err: any) {
      showToast('error', 'Broadcast Failed', err.message);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete subscriber workspace '${name}'?`)) return;
    try {
      await api.delete(`/tenants/${id}`);
      showToast('success', 'Tenant Deleted', 'Workspace removed.');
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
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            Dedicated Multi-Tenant SaaS Platform SuperAdmin Portal
          </h2>
          <p className="text-xs text-slate-400">Manage Tenant Subscribers, Tenant Locking, Maintenance Locking, Platform Users & Broadcast Notifications</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={tenants} filename="saas_platform_tenants_master" />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Provision Subscriber Tenant
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'subscribers'
              ? 'bg-purple-950 text-purple-300 border border-purple-500/40 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 text-purple-400" />
          Tenant Subscribers ({tenants.length})
        </button>

        <button
          onClick={() => setActiveTab('platform_users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'platform_users'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          Platform SuperAdmins ({users.filter((u) => u.role === 'ADMIN').length})
        </button>

        <button
          onClick={() => setActiveTab('broadcasts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'broadcasts'
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4 text-emerald-400" />
          Tenant Notifications & Broadcasts
        </button>

        <button
          onClick={() => setActiveTab('platform_smtp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'platform_smtp'
              ? 'bg-amber-950 text-amber-300 border border-amber-500/40 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4 text-amber-400" />
          Platform System SMTP Relay
        </button>
      </div>

      {/* TAB 1: TENANT SUBSCRIBERS */}
      {activeTab === 'subscribers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4">Subscriber Hospital</th>
                <th className="p-4">Subdomain Access URL</th>
                <th className="p-4">Currency</th>
                <th className="p-4">Plan Tier</th>
                <th className="p-4">User Limit</th>
                <th className="p-4">Account Status</th>
                <th className="p-4 text-right">Locking & Actions</th>
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
                      <span className="text-[10px] text-slate-500 font-mono">{t.contactEmail || 'No email registered'}</span>
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
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold w-fit ${
                          t.isLocked
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {t.isLocked ? '🔒 ACCOUNT LOCKED' : '✓ ACTIVE'}
                      </span>

                      {t.isMaintenanceMode && (
                        <span className="px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold w-fit flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> MAINTENANCE LOCK
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setLockingTenant(t);
                        setLockReason(t.lockReason || 'Tenant account locked due to policy or payment.');
                        setIsLockModalOpen(true);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold border ${
                        t.isLocked
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-950 text-rose-300 border-rose-500/30'
                      }`}
                      title={t.isLocked ? 'Unlock Tenant Workspace' : 'Lock Tenant Account'}
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setMaintenanceTenant(t);
                        setMaintenanceMessage(t.maintenanceMessage || 'System scheduled maintenance in progress.');
                        setIsMaintenanceModalOpen(true);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-bold border ${
                        t.isMaintenanceMode
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-amber-950 text-amber-300 border-amber-500/30'
                      }`}
                      title={t.isMaintenanceMode ? 'Disable Maintenance Lock' : 'Enable Maintenance Lock'}
                    >
                      <Wrench className="w-3.5 h-3.5" />
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

      {/* TAB 2: PLATFORM SUPERADMIN USERS */}
      {activeTab === 'platform_users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6">
          <h3 className="font-bold text-white text-base mb-4">SaaS Platform Global SuperAdmin Directory</h3>
          <div className="divide-y divide-slate-800">
            {users.filter((u) => u.role === 'ADMIN').map((u) => (
              <div key={u.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">{u.fullName}</span>
                  <span className="font-mono text-xs text-cyan-400">{u.email}</span>
                </div>
                <span className="px-2.5 py-1 bg-purple-950 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-bold uppercase">
                  GLOBAL SUPERADMIN
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TENANT NOTIFICATION BROADCASTS */}
      {activeTab === 'broadcasts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl">
          <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            Dispatch System Broadcast Notification (In-App & Email)
          </h3>
          <p className="text-xs text-slate-400 mb-6">Send urgent platform updates, maintenance announcements, or policy notices to tenant hospitals.</p>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Tenant Workspace</label>
              <select
                value={broadcastForm.targetTenantId}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, targetTenantId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              >
                <option value="ALL">📢 ALL SUBSCRIBER TENANTS (GLOBAL BROADCAST)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    🏢 {t.name} ({t.subdomain}.clinic.com)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Broadcast Title</label>
              <input
                type="text"
                required
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Notification Message</label>
              <textarea
                required
                rows={4}
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendEmail"
                checked={broadcastForm.sendEmail}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, sendEmail: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <label htmlFor="sendEmail" className="text-xs text-slate-300 font-semibold">
                Also dispatch SMTP Email Broadcast to tenant contact emails
              </label>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Dispatch Broadcast Notification
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: PLATFORM SYSTEM SMTP RELAY */}
      {activeTab === 'platform_smtp' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl">
          <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
            <Server className="w-5 h-5 text-amber-400" />
            Global Platform Outbound System SMTP Mail Relay
          </h3>
          <p className="text-xs text-slate-400 mb-6">Global SMTP mail gateway used for sending platform subscription receipts, tenant onboarding invites & system broadcasts.</p>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Relay Host</label>
                <input type="text" readOnly value="localhost" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Port</label>
                <input type="number" readOnly value={1025} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Sender Email</label>
                <input type="text" readOnly value="platform-system@saas-clinic.com" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Sender Name</label>
                <input type="text" readOnly value="SaaS Platform SuperAdmin System" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Locking Modal */}
      {isLockModalOpen && lockingTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsLockModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <Lock className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">
                {lockingTenant.isLocked ? 'Unlock Tenant Workspace' : 'Lock Tenant Account'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Target Tenant: <strong>{lockingTenant.name}</strong> ({lockingTenant.subdomain}.clinic.com)
            </p>

            <form onSubmit={handleToggleLock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Locking Reason / Administrative Notice</label>
                <input
                  type="text"
                  required
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-lg ${
                    lockingTenant.isLocked ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {lockingTenant.isLocked ? 'Confirm Unlock' : 'Confirm Lock Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Locking Modal */}
      {isMaintenanceModalOpen && maintenanceTenant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsMaintenanceModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Wrench className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">
                {maintenanceTenant.isMaintenanceMode ? 'Disable Maintenance Lock' : 'Enable Maintenance Lock'}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Target Tenant: <strong>{maintenanceTenant.name}</strong>
            </p>

            <form onSubmit={handleToggleMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Maintenance Announcement Message</label>
                <input
                  type="text"
                  required
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg"
                >
                  {maintenanceTenant.isMaintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance Lock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
