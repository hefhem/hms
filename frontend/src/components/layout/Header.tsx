import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, LogOut, Sparkles, Globe, KeyRound, Bell, Check, Clock, X } from 'lucide-react';
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
  const { currencySymbol, currencyCode } = useSettings();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // poll notifications every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

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
    <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-[110]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/50 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>HMS Enterprise Care v1.0</span>
        </div>
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
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white leading-tight">{n.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Password Change Button */}
        <button
          onClick={onOpenChangePassword}
          className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-xl transition-all border border-slate-800"
          title="Change Password"
        >
          <KeyRound className="w-4 h-4 text-cyan-400" />
        </button>

        {/* MFA Status Indicator */}
        <button
          onClick={onOpenMfa}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            user?.mfaEnabled
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:bg-amber-900/60'
          }`}
          title={user?.mfaEnabled ? 'MFA Protection Active' : 'Click to setup 2FA MFA'}
        >
          {user?.mfaEnabled ? (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>MFA Secured</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Enable MFA</span>
            </>
          )}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-white leading-tight">{user?.fullName}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${getRoleBadgeColor(
                  user?.role || '',
                )}`}
              >
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 rounded-xl transition-all border border-transparent hover:border-rose-500/30"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
