import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, LogOut, Sparkles, Globe, KeyRound, Bell, Check, Clock, X, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';

interface HeaderProps {
  onOpenMfa: () => void;
  onOpenCurrency: () => void;
  onOpenChangePassword: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMfa, onOpenCurrency, onOpenChangePassword }) => {
  const { user, logout } = useAuth();
  const { currencySymbol, currencyCode, updateCurrency } = useSettings();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchTenants();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchTenants = async () => {
    try {
      const res = await api.get('/tenants');
      setTenants(res.data);
      if (res.data.length > 0 && !selectedTenantId) {
        setSelectedTenantId(res.data[0].id);
      }
    } catch (err) {
      // silent catch
    }
  };

  const handleTenantSwitch = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant && tenant.currency) {
      const symbols: Record<string, string> = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: '$' };
      const sym = symbols[tenant.currency] || '$';
      updateCurrency(tenant.currency, sym);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      // silent catch
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'DOCTOR':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
      case 'NURSE':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'PHARMACIST':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'RECEPTIONIST':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      case 'BILLING_CLERK':
        return 'bg-pink-950/80 text-pink-300 border-pink-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-[110] backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Workspace Switcher Selector */}
        {tenants.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-300">
            <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
            <select
              value={selectedTenantId}
              onChange={(e) => handleTenantSwitch(e.target.value)}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  🏢 {t.name} ({t.currency})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Currency Configurator Button */}
        <button
          onClick={onOpenCurrency}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs font-bold text-cyan-300 hover:bg-slate-700 transition-all shadow-sm"
          title="Configure Active System Currency"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>{currencySymbol} ({currencyCode})</span>
        </button>

        {/* Real-time Stage Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800 relative"
            title="Stage Transition Notifications Feed"
          >
            <Bell className="w-4 h-4 text-cyan-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[120] overflow-hidden animate-fade-in">
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs text-white">Stage Transition Notifications ({user?.role})</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark All Read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No stage transition notifications recorded yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl transition-colors space-y-1 ${
                        !n.isRead ? 'bg-cyan-950/40 border border-cyan-500/20' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{n.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Change Password Security Button */}
        <button
          onClick={onOpenChangePassword}
          className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
          title="Change Account Password"
        >
          <KeyRound className="w-4 h-4" />
        </button>

        {/* User Identity & Role Badge */}
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-white leading-tight">{user.fullName}</span>
              <span className="text-[10px] text-cyan-400 font-mono">{user.email}</span>
            </div>

            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold tracking-wider border uppercase ${getRoleBadgeColor(user.role)}`}>
              {user.role}
            </span>

            {user.mfaEnabled ? (
              <button onClick={onOpenMfa} title="MFA Security Active">
                <ShieldCheck className="w-5 h-5 text-emerald-400 hover:text-emerald-300 transition-colors" />
              </button>
            ) : (
              <button onClick={onOpenMfa} title="Enable MFA 2-Factor Security">
                <ShieldAlert className="w-5 h-5 text-amber-400 hover:text-amber-300 transition-colors" />
              </button>
            )}

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-all border border-slate-800 ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
