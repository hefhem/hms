import React, { useEffect, useState } from 'react';
import { Server, Mail, Send, CheckCircle2, Save, Bell, Shield, FileText } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const TenantSettingsView: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tenant, setTenant] = useState<any>(null);
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const [smtpForm, setSmtpForm] = useState({
    smtpHost: 'localhost',
    smtpPort: 1025,
    smtpUser: '',
    smtpPassword: '',
    senderEmail: 'notifications@clinic.com',
    senderName: 'Hospital Care Team',
    emailHeaderTemplate: '<h2 style="color: #0284c7;">Hospital Healthcare Notice</h2>',
    emailFooterTemplate: '<p style="color: #64748b;">Thank you for choosing our hospital for your medical care.</p>',
  });

  const [notifPreferences, setNotifPreferences] = useState({
    notifyCheckedIn: true,
    notifyTriaged: true,
    notifyInConsultation: true,
    notifyLabResulted: true,
    notifyPrescriptionDispensed: true,
    sendBillingReceiptEmail: true,
  });

  useEffect(() => {
    fetchTenantSettings();
  }, [user]);

  const fetchTenantSettings = async () => {
    try {
      const res = await api.get('/tenants');
      if (res.data.length > 0) {
        const currentTenant = res.data[0];
        setTenant(currentTenant);
        setTestEmailRecipient(user?.email || 'admin@clinic.com');
        setSmtpForm({
          smtpHost: currentTenant.smtpHost || 'localhost',
          smtpPort: currentTenant.smtpPort || 1025,
          smtpUser: currentTenant.smtpUser || '',
          smtpPassword: currentTenant.smtpPassword || '',
          senderEmail: currentTenant.senderEmail || `notifications@${currentTenant.subdomain}.clinic.com`,
          senderName: currentTenant.senderName || `${currentTenant.name} Care Team`,
          emailHeaderTemplate: currentTenant.emailHeaderTemplate || `<h2 style="color: #0284c7;">${currentTenant.name} Healthcare Notice</h2>`,
          emailFooterTemplate: currentTenant.emailFooterTemplate || `<p style="color: #64748b;">Thank you for choosing ${currentTenant.name} for your healthcare needs.</p>`,
        });
      }
    } catch (err: any) {
      showToast('error', 'Error Loading Tenant Settings', err.message);
    }
  };

  const handleSaveSmtpSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    try {
      await api.put(`/tenants/${tenant.id}/smtp`, smtpForm);
      showToast('success', 'Tenant SMTP Gateway Saved', 'Outbound SMTP mail server settings and email templates updated.');
      fetchTenantSettings();
    } catch (err: any) {
      showToast('error', 'Save Failed', err.response?.data?.message || err.message);
    }
  };

  const handleTestSmtpConnection = async () => {
    if (!tenant || !testEmailRecipient) return;
    setIsTestingSmtp(true);
    try {
      const res = await api.post(`/tenants/${tenant.id}/test-smtp`, { recipientEmail: testEmailRecipient });
      showToast('success', 'Live SMTP Test Successful', res.data.message);
    } catch (err: any) {
      showToast('error', 'SMTP Test Failed', err.response?.data?.message || err.message);
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            Company SMTP Mail Gateway & Notification Preferences
          </h2>
          <p className="text-xs text-slate-400">Configure outbound SMTP mail relay credentials, patient email templates, and real-time stage notification rules.</p>
        </div>
      </div>

      {/* SECTION 1: PER-TENANT SMTP MAIL GATEWAY CONFIGURATION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Mail className="w-5 h-5 text-cyan-400" />
              Company Outbound SMTP Mail Gateway Server Settings
            </h3>
            <p className="text-xs text-slate-400">Used for dispatching patient billing receipts, staff onboarding credentials, and clinical stage notifications.</p>
          </div>

          <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono">
            {tenant ? tenant.name : 'Loading...'}
          </span>
        </div>

        <form onSubmit={handleSaveSmtpSettings} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SMTP Relay Host</label>
              <input
                type="text"
                required
                placeholder="smtp.stnicholas.com"
                value={smtpForm.smtpHost}
                onChange={(e) => setSmtpForm({ ...smtpForm, smtpHost: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SMTP Port</label>
              <input
                type="number"
                required
                value={smtpForm.smtpPort}
                onChange={(e) => setSmtpForm({ ...smtpForm, smtpPort: parseInt(e.target.value) || 587 })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
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
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SMTP Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={smtpForm.smtpPassword}
                onChange={(e) => setSmtpForm({ ...smtpForm, smtpPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
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
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Outbound Sender Name</label>
              <input
                type="text"
                required
                value={smtpForm.senderName}
                onChange={(e) => setSmtpForm({ ...smtpForm, senderName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>
          </div>

          {/* Email Header & Footer Custom Templates */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Custom Email Header HTML Template</label>
              <textarea
                rows={2}
                value={smtpForm.emailHeaderTemplate}
                onChange={(e) => setSmtpForm({ ...smtpForm, emailHeaderTemplate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Custom Email Footer HTML Template</label>
              <textarea
                rows={2}
                value={smtpForm.emailFooterTemplate}
                onChange={(e) => setSmtpForm({ ...smtpForm, emailFooterTemplate: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {/* Live Test Button */}
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="test@example.com"
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono w-56"
              />
              <button
                type="button"
                onClick={handleTestSmtpConnection}
                disabled={isTestingSmtp}
                className="px-4 py-2 bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isTestingSmtp ? 'Sending Test...' : 'Test SMTP Connection'}
              </button>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2 text-xs"
            >
              <Save className="w-4 h-4" />
              Save Outbound SMTP Settings
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: COMPANY NOTIFICATION PREFERENCES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
          <Bell className="w-5 h-5 text-purple-400" />
          Company Stage Notification & Patient Alert Preferences
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="font-bold text-xs text-white block">Patient Reception Check-In Alerts</span>
              <span className="text-[10px] text-slate-400">Notify attending doctor when patient checks in at front desk</span>
            </div>
            <input
              type="checkbox"
              checked={notifPreferences.notifyCheckedIn}
              onChange={(e) => setNotifPreferences({ ...notifPreferences, notifyCheckedIn: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="font-bold text-xs text-white block">Nurse Triage Completion Alerts</span>
              <span className="text-[10px] text-slate-400">Notify physician upon vitals recording completion</span>
            </div>
            <input
              type="checkbox"
              checked={notifPreferences.notifyTriaged}
              onChange={(e) => setNotifPreferences({ ...notifPreferences, notifyTriaged: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="font-bold text-xs text-white block">Lab Result Verification Alerts</span>
              <span className="text-[10px] text-slate-400">Notify ordering doctor when laboratory results are uploaded</span>
            </div>
            <input
              type="checkbox"
              checked={notifPreferences.notifyLabResulted}
              onChange={(e) => setNotifPreferences({ ...notifPreferences, notifyLabResulted: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="font-bold text-xs text-white block">Pharmacy Dispensing Email Receipts</span>
              <span className="text-[10px] text-slate-400">Dispatch electronic prescription receipt email to patient upon pharmacy dispensing</span>
            </div>
            <input
              type="checkbox"
              checked={notifPreferences.notifyPrescriptionDispensed}
              onChange={(e) => setNotifPreferences({ ...notifPreferences, notifyPrescriptionDispensed: e.target.checked })}
              className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
