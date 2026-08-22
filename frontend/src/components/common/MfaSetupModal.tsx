import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, Key, X, CheckCircle, Copy, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface MfaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MfaSetupModal: React.FC<MfaSetupModalProps> = ({ isOpen, onClose }) => {
  const [secret, setSecret] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const { showToast } = useToast();
  const { refreshUser, user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setOtpCode('');
      setIsSuccess(false);
      initSetup();
    }
  }, [isOpen]);

  const initSetup = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/auth/mfa/setup');
      setSecret(res.data.secret);
      setQrCodeUrl(res.data.qrCodeUrl);
    } catch (err: any) {
      showToast('error', 'MFA Setup Error', err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) return;

    setIsLoading(true);
    try {
      await api.post('/auth/mfa/enable', { otpCode });
      setIsSuccess(true);
      showToast('success', 'MFA Enabled', 'Two-Factor Authenticator linked successfully.');
      await refreshUser();
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 1500);
    } catch (err: any) {
      showToast('error', 'Verification Failed', err.response?.data?.message || 'Invalid 6-digit code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-400 shadow-lg shadow-emerald-950/40">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">Multi-Factor Authentication</h3>
            <p className="text-xs text-slate-400">Google Authenticator / Authy Setup</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-bounce" />
            <h4 className="text-xl font-bold text-white mb-1">MFA Activated!</h4>
            <p className="text-xs text-slate-300">Your account is now protected with 2FA TOTP authentication.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* QR Code Container */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center">
              {isLoading && !qrCodeUrl ? (
                <div className="w-44 h-44 mx-auto flex flex-col items-center justify-center text-slate-500 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs">Generating Key...</span>
                </div>
              ) : qrCodeUrl ? (
                <div className="space-y-3">
                  <div className="p-2 bg-white rounded-xl inline-block shadow-lg">
                    <img src={qrCodeUrl} alt="MFA QR Code" className="w-40 h-40" />
                  </div>
                  <p className="text-xs text-slate-400">Scan QR code using Google Authenticator or Authy</p>
                </div>
              ) : null}

              {/* Secret Key Input Box */}
              {secret && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
                  <div className="text-left overflow-hidden">
                    <span className="block text-[10px] uppercase font-semibold text-slate-400">Manual Setup Key</span>
                    <span className="font-mono text-xs text-cyan-300 font-bold tracking-wider truncate block">
                      {secret}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-xs flex items-center gap-1 transition-colors shrink-0 ml-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* OTP Verification Form */}
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Enter 6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-2xl text-center text-2xl font-mono tracking-widest text-white focus:outline-none transition-colors shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2"
                >
                  {isLoading ? 'Verifying...' : 'Enable MFA Protection'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
