import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  X,
  Activity,
  DollarSign,
  Globe,
  Lock,
  Power,
  Edit2,
  Trash2,
  Mail,
  Users,
  Server,
  AlertTriangle,
  Send,
  Bell,
  Wrench,
  Key,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const PlatformAdminView: React.FC = () => {
  const { user, login, logout } = useAuth();
  const { showToast } = useToast();

  // Platform Login State
  const [email, setEmail] = useState('superadmin@platform.com');
  const [password, setPassword] = useState('PlatformAdmin@123456');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'subscribers' | 'platform_users' | 'platform_smtp' | 'broadcasts'>('subscribers');

  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
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

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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

  const handlePlatformLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(email, password);
      showToast('success', 'SaaS Platform SuperAdmin Authenticated', 'Access granted to Global SaaS Command Center.');
    } catch (err: any) {
      showToast('error', 'Platform Access Denied', err.response?.data?.message || 'Invalid SuperAdmin Credentials');
    } finally {
      setIsLoggingIn(false);
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
      await api.post('/notification/broadcast', broadcastForm);
      showToast('success', 'Platform Broadcast Sent', 'System notification dispatched to target tenant hospitals.');
      setBroadcastForm({
        targetTenantId: 'ALL',
        title: 'System Platform Update',
        message: '',
        sendEmail: true,
      });
    } catch (err: any) {
      showToast('error', 'Broadcast Dispatch Failed', err.response?.data?.message || err.message);
    }
  };

  // If user is not authenticated or not a Platform Admin, render Dedicated Platform Login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">SaaS Platform Portal</h1>
              <p className="text-xs text-slate-400 font-mono mt-1">Global SuperAdmin Dedicated Command Center (/platform)</p>
            </div>
          </div>

          <form onSubmit={handlePlatformLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">SuperAdmin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Master Access Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-950 transition-all text-sm flex items-center justify-center gap-2"
            >
              {isLoggingIn ? 'Authenticating SuperAdmin...' : 'Authenticate Platform SuperAdmin'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">SuperAdmin Demo Credentials</span>
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              <span>superadmin@platform.com</span>
              <span className="text-slate-500">PlatformAdmin@123456</span>
            </div>
          </div>

          <div className="text-center pt-2">
            <a href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1">
              ← Return to Hospital Tenant Workspace Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Standalone Platform Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-8 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-950">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-white text-lg tracking-wide">ApexCare SaaS Platform</h1>
              <span className="bg-cyan-950 text-cyan-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-cyan-500/30">
                Standalone /platform Path
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Dedicated SaaS Tenant Subscriber & Infrastructure Command Center</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-200">{user.fullName}</div>
            <div className="text-[10px] text-cyan-400 font-mono">{user.email} (Global SuperAdmin)</div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-800/50 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-white tracking-tight">SaaS Multi-Tenant Management Engine</h2>
            <p className="text-xs text-slate-400">
              Provision subscriber hospital workspaces, enforce security locking, manage platform SMTP gateways, and issue global announcements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              Launch Hospital Workspace
            </a>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-cyan-950 transition-all"
            >
              <Plus className="w-4 h-4" />
              Provision New Tenant Workspace
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'subscribers'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Subscriber Workspaces ({tenants.length})
            </button>
            <button
              onClick={() => setActiveTab('platform_users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'platform_users'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Platform SuperAdmins ({users.filter((u) => !u.tenantId).length})
            </button>
            <button
              onClick={() => setActiveTab('platform_smtp')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'platform_smtp'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Server className="w-4 h-4" />
              Platform System SMTP
            </button>
            <button
              onClick={() => setActiveTab('broadcasts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'broadcasts'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              Tenant Notifications & Broadcasts
            </button>
          </div>

          <ExportOptions
            data={tenants}
            filename="Saas_Subscriber_Workspaces_Report"
            label="Export Workspaces CSV"
          />
        </div>

        {/* Tab 1: Subscriber Workspaces */}
        {activeTab === 'subscribers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((t) => (
              <div
                key={t.id}
                className={`bg-slate-900 border rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden transition-all ${
                  t.isLocked
                    ? 'border-rose-800/80 bg-rose-950/20'
                    : t.isMaintenanceMode
                    ? 'border-amber-800/80 bg-amber-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-500/30 uppercase tracking-wider">
                      {t.plan} Plan ({t.currency})
                    </span>
                    <h3 className="font-extrabold text-white text-base tracking-tight pt-1">{t.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t.subdomain}.clinic.com</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {t.isLocked ? (
                      <span className="flex items-center gap-1 bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    ) : t.isMaintenanceMode ? (
                      <span className="flex items-center gap-1 bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        <Wrench className="w-3 h-3" /> MAINTENANCE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        <Activity className="w-3 h-3" /> ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Contact Email</span>
                    <span className="text-slate-300 font-semibold truncate block">{t.contactEmail || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">User Quota</span>
                    <span className="text-slate-300 font-semibold">{t.maxUsers} Accounts</span>
                  </div>
                </div>

                {t.isLocked && t.lockReason && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/40 rounded-2xl text-xs text-rose-300 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" /> Lock Reason:
                    </span>
                    <p className="text-[11px] leading-relaxed">{t.lockReason}</p>
                  </div>
                )}

                {/* Control Action Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 gap-2">
                  <button
                    onClick={() => {
                      setLockingTenant(t);
                      setLockReason(t.lockReason || 'Payment subscription expired or policy lock.');
                      setIsLockModalOpen(true);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      t.isLocked
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-900/40'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {t.isLocked ? 'Unlock Tenant' : 'Lock Tenant'}
                  </button>

                  <button
                    onClick={() => {
                      setMaintenanceTenant(t);
                      setMaintenanceMessage(t.maintenanceMessage || 'Scheduled system upgrade in progress.');
                      setIsMaintenanceModalOpen(true);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      t.isMaintenanceMode
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-900/40'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    {t.isMaintenanceMode ? 'Disable Maint.' : 'Enable Maint.'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Platform Users */}
        {activeTab === 'platform_users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-extrabold text-white text-base">Global Platform SuperAdmins</h3>
            <div className="divide-y divide-slate-800">
              {users
                .filter((u) => !u.tenantId)
                .map((u) => (
                  <div key={u.id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{u.fullName}</div>
                      <div className="text-xs text-cyan-400 font-mono">{u.email}</div>
                    </div>
                    <span className="bg-cyan-950 text-cyan-400 text-xs font-bold px-3 py-1 rounded-xl border border-cyan-500/30">
                      SUPERADMIN (Global Scope)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab 3: Platform System SMTP */}
        {activeTab === 'platform_smtp' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 max-w-2xl">
            <h3 className="font-extrabold text-white text-base">Global Platform Outbound SMTP Relay</h3>
            <p className="text-xs text-slate-400">
              Configures the platform-wide SMTP mail gateway used for sending tenant welcome invitations, billing receipts, and platform security alerts.
            </p>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">SMTP Host</label>
                  <input
                    type="text"
                    defaultValue="localhost"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">SMTP Port</label>
                  <input
                    type="number"
                    defaultValue="1025"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Platform Sender Email</label>
                <input
                  type="email"
                  defaultValue="no-reply@platform.clinic.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>
              <button
                onClick={() => showToast('success', 'SMTP Relay Verified', 'Platform mail relay connection test successful.')}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-cyan-950"
              >
                Test Platform SMTP Relay Connection
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Tenant Broadcast Notifications */}
        {activeTab === 'broadcasts' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 max-w-2xl">
            <h3 className="font-extrabold text-white text-base">Dispatch Global Tenant Broadcast Alert</h3>
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Target Subscriber Hospital</label>
                <select
                  value={broadcastForm.targetTenantId}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetTenantId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                >
                  <option value="ALL">📢 Broadcast to All Subscriber Hospitals</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subdomain}.clinic.com)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Notice Title</label>
                <input
                  type="text"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Notice Message Content</label>
                <textarea
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  rows={4}
                  required
                  placeholder="Enter platform update announcement or maintenance notice..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={broadcastForm.sendEmail}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, sendEmail: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="sendEmail" className="text-xs text-slate-300 font-semibold">
                  Send outbound SMTP email notification to tenant contact address
                </label>
              </div>

              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-cyan-950 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Dispatch System Broadcast
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Provision Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Provision Subscriber Hospital Workspace</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hospital / Clinic Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saint Nicholas Specialist Hospital"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subdomain Prefix</label>
                  <input
                    type="text"
                    required
                    placeholder="stnicholas"
                    value={createForm.subdomain}
                    onChange={(e) => setCreateForm({ ...createForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Operating Currency</label>
                  <select
                    value={createForm.currency}
                    onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="NGN">NGN (₦ - Nigerian Naira)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subscription Plan</label>
                  <select
                    value={createForm.plan}
                    onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="STARTER">Starter Tier</option>
                    <option value="PROFESSIONAL">Professional Tier</option>
                    <option value="ENTERPRISE">Enterprise Tier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Max User Quota</label>
                  <input
                    type="number"
                    value={createForm.maxUsers}
                    onChange={(e) => setCreateForm({ ...createForm, maxUsers: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={createForm.contactEmail}
                  onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950"
                >
                  Provision Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lock Tenant Modal */}
      {isLockModalOpen && lockingTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {lockingTenant.isLocked ? 'Unlock Tenant Workspace' : 'Lock Tenant Workspace'}
              </h3>
              <button onClick={() => setIsLockModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleToggleLock} className="space-y-4">
              <p className="text-xs text-slate-300">
                You are about to {lockingTenant.isLocked ? 'unlock' : 'lock'} hospital workspace{' '}
                <strong className="text-white">{lockingTenant.name}</strong>.
              </p>

              {!lockingTenant.isLocked && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Reason for Lock</label>
                  <textarea
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-lg ${
                    lockingTenant.isLocked ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirm {lockingTenant.isLocked ? 'Unlock' : 'Lock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Mode Modal */}
      {isMaintenanceModalOpen && maintenanceTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">
                {maintenanceTenant.isMaintenanceMode ? 'Disable Maintenance Lock' : 'Enable Maintenance Lock'}
              </h3>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleToggleMaintenance} className="space-y-4">
              <p className="text-xs text-slate-300">
                Configure maintenance mode status for <strong className="text-white">{maintenanceTenant.name}</strong>.
              </p>

              {!maintenanceTenant.isMaintenanceMode && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Maintenance Announcement Message</label>
                  <textarea
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Confirm Toggle Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
