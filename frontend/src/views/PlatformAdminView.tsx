import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  X,
  Activity,
  Globe,
  Lock,
  Edit2,
  Trash2,
  Users,
  Server,
  AlertTriangle,
  Send,
  Wrench,
  Key,
  ExternalLink,
  LogOut,
  Check,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const PlatformAdminView: React.FC = () => {
  const { user, login, logout } = useAuth();
  const { showToast } = useToast();

  // Platform Login State
  const [loginEmail, setLoginEmail] = useState('superadmin@platform.com');
  const [loginPassword, setLoginPassword] = useState('Admin@123456');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<'subscribers' | 'platform_users' | 'platform_smtp' | 'broadcasts'>('subscribers');

  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [lockingTenant, setLockingTenant] = useState<any>(null);
  const [maintenanceTenant, setMaintenanceTenant] = useState<any>(null);
  const [editingTenant, setEditingTenant] = useState<any>(null);
  const [deletingTenant, setDeletingTenant] = useState<any>(null);

  // Platform SMTP State
  const [smtpConfig, setSmtpConfig] = useState({
    PLATFORM_SMTP_HOST: 'localhost',
    PLATFORM_SMTP_PORT: '1025',
    PLATFORM_SMTP_USER: '',
    PLATFORM_SMTP_PASS: '',
    PLATFORM_SMTP_FROM_EMAIL: 'no-reply@platform.clinic.com',
    PLATFORM_SMTP_FROM_NAME: 'ApexCare SaaS Platform Administrator',
    PLATFORM_SMTP_SECURE: 'false',
    PLATFORM_SMTP_HEADER_TEMPLATE: '<div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 8px;">',
    PLATFORM_SMTP_FOOTER_TEMPLATE: '<p style="font-size: 11px; color: #94a3b8; border-top: 1px solid #334155; padding-top: 10px; margin-top: 20px;">ApexCare Enterprise SaaS Platform &copy; 2026</p></div>',
  });
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  // SuperAdmin CRUD Modals & Forms
  const [isCreateAdminModalOpen, setIsCreateAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [resetPassAdmin, setResetPassAdmin] = useState<any>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<any>(null);

  const [adminForm, setAdminForm] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [newPasswordInput, setNewPasswordInput] = useState('PlatformAdmin@123456');

  // Tenant Modals & Forms
  const [isCreateTenantModalOpen, setIsCreateTenantModalOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const [createTenantForm, setCreateTenantForm] = useState({
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
      fetchSmtpSettings();
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

  const fetchSmtpSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setSmtpConfig((prev) => ({
          ...prev,
          PLATFORM_SMTP_HOST: res.data.PLATFORM_SMTP_HOST || 'localhost',
          PLATFORM_SMTP_PORT: res.data.PLATFORM_SMTP_PORT || '1025',
          PLATFORM_SMTP_USER: res.data.PLATFORM_SMTP_USER || '',
          PLATFORM_SMTP_PASS: res.data.PLATFORM_SMTP_PASS || '',
          PLATFORM_SMTP_FROM_EMAIL: res.data.PLATFORM_SMTP_FROM_EMAIL || 'no-reply@platform.clinic.com',
          PLATFORM_SMTP_FROM_NAME: res.data.PLATFORM_SMTP_FROM_NAME || 'ApexCare SaaS Platform Administrator',
          PLATFORM_SMTP_SECURE: res.data.PLATFORM_SMTP_SECURE || 'false',
          PLATFORM_SMTP_HEADER_TEMPLATE: res.data.PLATFORM_SMTP_HEADER_TEMPLATE || prev.PLATFORM_SMTP_HEADER_TEMPLATE,
          PLATFORM_SMTP_FOOTER_TEMPLATE: res.data.PLATFORM_SMTP_FOOTER_TEMPLATE || prev.PLATFORM_SMTP_FOOTER_TEMPLATE,
        }));
      }
    } catch (err: any) {
      // silent catch
    }
  };

  const handlePlatformLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(loginEmail, loginPassword);
      showToast('success', 'SaaS Platform SuperAdmin Authenticated', 'Access granted to Global SaaS Command Center.');
    } catch (err: any) {
      showToast('error', 'Platform Access Denied', err.response?.data?.message || 'Invalid SuperAdmin Credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- Platform SMTP Handlers ---
  const handleSaveSmtpSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    try {
      await api.put('/settings', smtpConfig);
      showToast('success', 'Platform SMTP Gateway Saved', 'Global outbound mail server settings successfully saved.');
    } catch (err: any) {
      showToast('error', 'Failed to Save SMTP Settings', err.response?.data?.message || err.message);
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestPlatformSmtp = async () => {
    setIsTestingSmtp(true);
    try {
      await api.post('/settings/test-platform-smtp', {
        host: smtpConfig.PLATFORM_SMTP_HOST,
        port: parseInt(smtpConfig.PLATFORM_SMTP_PORT) || 1025,
        user: smtpConfig.PLATFORM_SMTP_USER,
        pass: smtpConfig.PLATFORM_SMTP_PASS,
        secure: smtpConfig.PLATFORM_SMTP_SECURE === 'true',
        fromEmail: smtpConfig.PLATFORM_SMTP_FROM_EMAIL,
        fromName: smtpConfig.PLATFORM_SMTP_FROM_NAME,
        headerTemplate: smtpConfig.PLATFORM_SMTP_HEADER_TEMPLATE,
        footerTemplate: smtpConfig.PLATFORM_SMTP_FOOTER_TEMPLATE,
      });
      showToast('success', 'SMTP Gateway Test Passed', `Dispatched test mail from ${smtpConfig.PLATFORM_SMTP_FROM_EMAIL}`);
    } catch (err: any) {
      showToast('error', 'SMTP Test Connection Failed', err.response?.data?.message || err.message);
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // --- Platform SuperAdmin CRUD Handlers ---
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        fullName: adminForm.fullName,
        email: adminForm.email,
        password: adminForm.password || 'PlatformAdmin@123456',
        role: 'ADMIN',
        tenantId: null,
        isActive: true,
      });
      showToast('success', 'Platform SuperAdmin Created', `Onboarded ${adminForm.fullName} (${adminForm.email})`);
      setIsCreateAdminModalOpen(false);
      setAdminForm({ fullName: '', email: '', password: '' });
      fetchData();
    } catch (err: any) {
      showToast('error', 'SuperAdmin Creation Failed', err.response?.data?.message || err.message);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    try {
      await api.put(`/users/${editingAdmin.id}`, {
        fullName: editingAdmin.fullName,
        email: editingAdmin.email,
      });
      showToast('success', 'SuperAdmin Profile Updated', `Updated ${editingAdmin.fullName}`);
      setEditingAdmin(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Profile Update Failed', err.response?.data?.message || err.message);
    }
  };

  const handleToggleAdminStatus = async (userObj: any) => {
    try {
      const nextState = !userObj.isActive;
      await api.put(`/users/${userObj.id}/status`, { isActive: nextState });
      showToast('success', 'SuperAdmin Status Updated', `Account is now ${nextState ? 'ACTIVE' : 'INACTIVE'}`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Status Toggle Failed', err.response?.data?.message || err.message);
    }
  };

  const handleResetAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassAdmin) return;
    try {
      await api.put(`/users/${resetPassAdmin.id}/reset-password`, { newPassword: newPasswordInput });
      showToast('success', 'Password Reset Successful', `Updated password for ${resetPassAdmin.fullName}`);
      setResetPassAdmin(null);
    } catch (err: any) {
      showToast('error', 'Password Reset Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteAdmin) return;
    try {
      await api.delete(`/users/${deleteAdmin.id}`);
      showToast('success', 'SuperAdmin Account Deleted', `Removed ${deleteAdmin.fullName}`);
      setDeleteAdmin(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Deletion Failed', err.response?.data?.message || err.message);
    }
  };

  // --- Subscriber Workspace Tenant CRUD Handlers ---
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tenants', createTenantForm);
      showToast('success', 'Subscriber Workspace Provisioned', `Created workspace '${createTenantForm.name}' on '${createTenantForm.subdomain}.clinic.com'`);
      setIsCreateTenantModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Provisioning Failed', err.response?.data?.message || err.message);
    }
  };

  const handleEditTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      await api.put(`/tenants/${editingTenant.id}`, {
        name: editingTenant.name,
        subdomain: editingTenant.subdomain,
        currency: editingTenant.currency,
        plan: editingTenant.plan,
        maxUsers: parseInt(editingTenant.maxUsers) || 50,
        contactEmail: editingTenant.contactEmail,
        contactPhone: editingTenant.contactPhone,
      });
      showToast('success', 'Workspace Updated', `Saved changes for subscriber workspace '${editingTenant.name}'`);
      setEditingTenant(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Workspace Update Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteTenant = async () => {
    if (!deletingTenant) return;
    try {
      await api.delete(`/tenants/${deletingTenant.id}`);
      showToast('success', 'Subscriber Workspace Deleted', `Removed hospital workspace '${deletingTenant.name}'`);
      setDeletingTenant(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Workspace Deletion Failed', err.response?.data?.message || err.message);
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

  const isPlatformAdmin = user && (user.email === 'superadmin@platform.com' || !user.tenantId);

  if (!user || !isPlatformAdmin) {
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
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Master Access Key</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
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

  const superAdminsList = users.filter((u) => !u.tenantId);

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
              onClick={() => setIsCreateTenantModalOpen(true)}
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
              Platform SuperAdmins ({superAdminsList.length})
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
              Global Platform Outbound SMTP
            </button>
            <button
              onClick={() => setActiveTab('broadcasts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'broadcasts'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Send className="w-4 h-4" />
              Tenant Notifications & Broadcasts
            </button>
          </div>

          <ExportOptions
            data={tenants}
            filename="Saas_Subscriber_Workspaces_Report"
            label="Export Workspaces CSV"
          />
        </div>

        {/* Tab 1: Subscriber Workspaces Full CRUD */}
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

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingTenant({ ...t })}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                      title="Edit Workspace Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingTenant(t)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors"
                      title="Delete Tenant Workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                    {t.isLocked ? 'Unlock Workspace' : 'Lock Workspace'}
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

        {/* Tab 2: Full Platform SuperAdmin CRUD */}
        {activeTab === 'platform_users' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" /> Global Platform SuperAdmin Directory
                </h3>
                <p className="text-xs text-slate-400">Manage high-privilege administrators with global multi-tenant access.</p>
              </div>

              <button
                onClick={() => {
                  setAdminForm({ fullName: '', email: '', password: '' });
                  setIsCreateAdminModalOpen(true);
                }}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-cyan-950 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Platform SuperAdmin
              </button>
            </div>

            {/* SuperAdmin Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider">
                    <th className="py-3 px-4">SuperAdmin Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Scope & Role</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {superAdminsList.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                          {admin.fullName.charAt(0)}
                        </div>
                        {admin.fullName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-400">{admin.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold">
                          GLOBAL SUPERADMIN
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleAdminStatus(admin)}
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                            admin.isActive !== false
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border-rose-800'
                          }`}
                        >
                          {admin.isActive !== false ? '● ACTIVE' : '○ INACTIVE'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingAdmin(admin)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setResetPassAdmin(admin);
                              setNewPasswordInput('PlatformAdmin@123456');
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition-colors"
                            title="Reset Master Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteAdmin(admin)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-lg transition-colors"
                            title="Delete SuperAdmin Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Complete Global Platform System SMTP Configuration */}
        {activeTab === 'platform_smtp' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 max-w-3xl">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" /> Global Platform Outbound SMTP Relay Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure the master outbound SMTP mail gateway used for platform invitations, subscription billing notices, tenant lock alerts, and security confirmations.
              </p>
            </div>

            <form onSubmit={handleSaveSmtpSettings} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">SMTP Host Server</label>
                  <input
                    type="text"
                    required
                    value={smtpConfig.PLATFORM_SMTP_HOST}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, PLATFORM_SMTP_HOST: e.target.value })}
                    placeholder="e.g. smtp.mailtrap.io or localhost"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">SMTP Port</label>
                  <input
                    type="number"
                    required
                    value={smtpConfig.PLATFORM_SMTP_PORT}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, PLATFORM_SMTP_PORT: e.target.value })}
                    placeholder="e.g. 1025, 587, 465"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">SMTP Username</label>
                  <input
                    type="text"
                    value={smtpConfig.PLATFORM_SMTP_USER}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, PLATFORM_SMTP_USER: e.target.value })}
                    placeholder="Optional SMTP Username"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">SMTP Password</label>
                  <input
                    type="password"
                    value={smtpConfig.PLATFORM_SMTP_PASS}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, PLATFORM_SMTP_PASS: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Platform Sender Email</label>
                  <input
                    type="email"
                    required
                    value={smtpConfig.PLATFORM_SMTP_FROM_EMAIL}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, PLATFORM_SMTP_FROM_EMAIL: e.target.value })}
                    placeholder="no-reply@platform.clinic.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Sender Display Name</label>
                  <input
                    type="text"
                    required
                    value={smtpConfig.PLATFORM_SMTP_FROM_NAME}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, PLATFORM_SMTP_FROM_NAME: e.target.value })}
                    placeholder="ApexCare SaaS Platform Administrator"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">SSL / TLS Encryption Protocol</label>
                <select
                  value={smtpConfig.PLATFORM_SMTP_SECURE}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, PLATFORM_SMTP_SECURE: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                >
                  <option value="false">Disabled / TLS StartTLS (Default Port 1025 / 587)</option>
                  <option value="true">Enabled / Direct SSL/TLS Encrypted (Port 465)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Global HTML Email Header Template</label>
                <textarea
                  value={smtpConfig.PLATFORM_SMTP_HEADER_TEMPLATE}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, PLATFORM_SMTP_HEADER_TEMPLATE: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Global HTML Email Footer Template</label>
                <textarea
                  value={smtpConfig.PLATFORM_SMTP_FOOTER_TEMPLATE}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, PLATFORM_SMTP_FOOTER_TEMPLATE: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800 gap-4">
                <button
                  type="button"
                  onClick={handleTestPlatformSmtp}
                  disabled={isTestingSmtp}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingSmtp ? 'animate-spin' : ''}`} />
                  {isTestingSmtp ? 'Testing Mail Gateway...' : 'Test Platform SMTP Relay Connection'}
                </button>

                <button
                  type="submit"
                  disabled={isSavingSmtp}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-950 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {isSavingSmtp ? 'Saving Gateway Settings...' : 'Save Platform SMTP Settings'}
                </button>
              </div>
            </form>
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

      {/* --- MODALS --- */}

      {/* Edit Subscriber Tenant Workspace Modal */}
      {editingTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Subscriber Workspace Details</h3>
              <button onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditTenant} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hospital / Clinic Name</label>
                <input
                  type="text"
                  required
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subdomain Prefix</label>
                  <input
                    type="text"
                    required
                    value={editingTenant.subdomain}
                    onChange={(e) => setEditingTenant({ ...editingTenant, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Operating Currency</label>
                  <select
                    value={editingTenant.currency}
                    onChange={(e) => setEditingTenant({ ...editingTenant, currency: e.target.value })}
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
                    value={editingTenant.plan}
                    onChange={(e) => setEditingTenant({ ...editingTenant, plan: e.target.value })}
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
                    value={editingTenant.maxUsers}
                    onChange={(e) => setEditingTenant({ ...editingTenant, maxUsers: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={editingTenant.contactEmail || ''}
                  onChange={(e) => setEditingTenant({ ...editingTenant, contactEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editingTenant.contactPhone || ''}
                  onChange={(e) => setEditingTenant({ ...editingTenant, contactPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subscriber Tenant Modal */}
      {deletingTenant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-rose-400 text-base">Delete Subscriber Workspace</h3>
              <button onClick={() => setDeletingTenant(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete hospital workspace{' '}
              <strong className="text-white">{deletingTenant.name}</strong> ({deletingTenant.subdomain}.clinic.com)?
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTenant(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTenant}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create SuperAdmin Modal */}
      {isCreateAdminModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Onboard New Platform SuperAdmin</h3>
              <button onClick={() => setIsCreateAdminModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alexander Vance"
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">SuperAdmin Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. Vance@platform.com"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Master Password</label>
                <input
                  type="password"
                  required
                  placeholder="PlatformAdmin@123456"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateAdminModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950"
                >
                  Create SuperAdmin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit SuperAdmin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Edit SuperAdmin Profile</h3>
              <button onClick={() => setEditingAdmin(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditAdmin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingAdmin.fullName}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, fullName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset SuperAdmin Password Modal */}
      {resetPassAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Reset SuperAdmin Password</h3>
              <button onClick={() => setResetPassAdmin(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetAdminPassword} className="space-y-4">
              <p className="text-xs text-slate-300">
                Update access password for SuperAdmin <strong className="text-white">{resetPassAdmin.fullName}</strong>.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetPassAdmin(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete SuperAdmin Modal */}
      {deleteAdmin && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-rose-400 text-base">Delete SuperAdmin Account</h3>
              <button onClick={() => setDeleteAdmin(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete SuperAdmin account{' '}
              <strong className="text-white">{deleteAdmin.fullName}</strong> ({deleteAdmin.email})?
            </p>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteAdmin(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision Tenant Modal */}
      {isCreateTenantModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Provision Subscriber Hospital Workspace</h3>
              <button onClick={() => setIsCreateTenantModalOpen(false)} className="text-slate-400 hover:text-white">
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
                  value={createTenantForm.name}
                  onChange={(e) => setCreateTenantForm({ ...createTenantForm, name: e.target.value })}
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
                    value={createTenantForm.subdomain}
                    onChange={(e) => setCreateTenantForm({ ...createTenantForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Operating Currency</label>
                  <select
                    value={createTenantForm.currency}
                    onChange={(e) => setCreateTenantForm({ ...createTenantForm, currency: e.target.value })}
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
                    value={createTenantForm.plan}
                    onChange={(e) => setCreateTenantForm({ ...createTenantForm, plan: e.target.value })}
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
                    value={createTenantForm.maxUsers}
                    onChange={(e) => setCreateTenantForm({ ...createTenantForm, maxUsers: parseInt(e.target.value) || 10 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={createTenantForm.contactEmail}
                  onChange={(e) => setCreateTenantForm({ ...createTenantForm, contactEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTenantModalOpen(false)}
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
