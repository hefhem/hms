import React, { useState } from 'react';
import { HeartPulse, Lock, Mail, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('admin@clinic.com');
  const [password, setPassword] = useState('Admin@123456');
  const [otpCode, setOtpCode] = useState('');
  const [requireMfa, setRequireMfa] = useState(false);
  const [tempUserId, setTempUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, verifyMfa } = useAuth();
  const { showToast } = useToast();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.requireMfa) {
        setRequireMfa(true);
        setTempUserId(email); // will be used to complete OTP
        showToast('info', 'MFA Required', 'Please enter your 6-digit TOTP authenticator code.');
      } else {
        showToast('success', 'Access Granted', 'Welcome to ApexCare Enterprise HMS');
      }
    } catch (err: any) {
      showToast('error', 'Authentication Error', err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) return;

    setIsLoading(true);
    try {
      await verifyMfa(tempUserId, otpCode);
      showToast('success', 'MFA Verified', 'Welcome to ApexCare Enterprise HMS');
    } catch (err: any) {
      showToast('error', 'Invalid MFA Code', err.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginRoles = [
    { label: 'Admin', email: 'admin@clinic.com', role: 'ADMIN' },
    { label: 'Doctor', email: 'doctor@clinic.com', role: 'DOCTOR' },
    { label: 'Nurse', email: 'nurse@clinic.com', role: 'NURSE' },
    { label: 'Pharmacist', email: 'pharmacist@clinic.com', role: 'PHARMACIST' },
    { label: 'Receptionist', email: 'receptionist@clinic.com', role: 'RECEPTIONIST' },
    { label: 'Billing', email: 'billing@clinic.com', role: 'BILLING_CLERK' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-2xl shadow-xl shadow-cyan-950/60 mb-4">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-wide">ApexCare Enterprise</h1>
          <p className="text-sm text-slate-400 mt-1">Hospital & Clinic Management System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          {!requireMfa ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              <div className="text-center mb-4">
                <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-white">2FA Security Challenge</h3>
                <p className="text-xs text-slate-400">Enter the 6-digit verification code from your authenticator app</p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Verifying OTP...' : 'Verify & Continue'}
              </button>
            </form>
          )}

          {/* Quick Seed Logins */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Quick Role Demo Accounts (One-Click)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {quickLoginRoles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    setEmail(r.email);
                    setPassword('Admin@123456');
                  }}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all text-xs"
                >
                  <div className="font-semibold text-white">{r.label}</div>
                  <div className="text-[10px] text-cyan-400 font-mono">{r.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
