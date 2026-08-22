import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, CheckCircle2, XCircle, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { ExportOptions } from '../components/common/ExportOptions';
import { SearchableSelect, Option } from '../components/common/SearchableSelect';

export const InsuranceView: React.FC = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { formatCurrency } = useSettings();
  const { showToast } = useToast();

  const [claimForm, setClaimForm] = useState({
    patientId: '',
    hmoProvider: 'Reliance HMO',
    policyNumber: 'POL-REL-882190',
    preAuthCode: 'AUTH-9921',
    claimAmount: 185.0,
    copayAmount: 15.0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([api.get('/insurance/claims'), api.get('/patients')]);
      setClaims(cRes.data);
      setPatients(pRes.data);
      if (pRes.data.length > 0) {
        setClaimForm((prev) => ({ ...prev, patientId: pRes.data[0].id }));
      }
    } catch (err: any) {
      showToast('error', 'Error Loading Claims', err.message);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimForm.patientId) {
      showToast('warning', 'Missing Selection', 'Select a patient.');
      return;
    }
    try {
      await api.post('/insurance/claims', claimForm);
      showToast('success', 'Claim Submitted', 'HMO Pre-authorization & claim batch created.');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.response?.data?.message || err.message);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, version: number) => {
    try {
      await api.put(`/insurance/claims/${id}/status`, { status, version });
      showToast('success', 'Claim Status Updated', `Claim status changed to ${status}`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.response?.data?.message || err.message);
    }
  };

  const patientOptions: Option[] = patients.map((p) => ({
    value: p.id,
    label: p.fullName,
    subLabel: `${p.mrn} • Phone: ${p.phone}`,
  }));

  const hmoProviders = ['Reliance HMO', 'Hygeia HMO', 'AXA Mansard', 'Bupa International', 'NHIA State Scheme', 'Corporate Direct Billing'];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Insurance, HMO & Claims Management</h2>
          <p className="text-xs text-slate-400">Payer master, pre-authorization codes, co-pay split & claim batch submission</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={claims} filename="hms_insurance_claims" />
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Submit HMO Claim
          </button>
        </div>
      </div>

      {/* Claims Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Claim #</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">HMO Provider</th>
              <th className="p-4">Policy & Auth Code</th>
              <th className="p-4">Claim Amount</th>
              <th className="p-4">Co-Pay</th>
              <th className="p-4">Status</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {claims.map((clm) => (
              <tr key={clm.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-mono font-bold text-cyan-400">{clm.claimNumber}</td>
                <td className="p-4 font-medium text-white">{clm.patientName}</td>
                <td className="p-4 font-semibold text-purple-300">{clm.hmoProvider}</td>
                <td className="p-4 text-xs font-mono text-slate-400">
                  {clm.policyNumber}
                  {clm.preAuthCode && <span className="block text-[10px] text-amber-400 font-bold">Auth: {clm.preAuthCode}</span>}
                </td>
                <td className="p-4 font-mono font-bold text-emerald-400">{formatCurrency(clm.claimAmount)}</td>
                <td className="p-4 font-mono text-xs text-slate-400">{formatCurrency(clm.copayAmount)}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      clm.status === 'APPROVED' || clm.status === 'SETTLED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : clm.status === 'REJECTED'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {clm.status}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-500">v{clm.version}</td>
                <td className="p-4 text-right space-x-2">
                  {clm.status === 'SUBMITTED' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(clm.id, 'APPROVED', clm.version)}
                        className="p-1.5 bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900 rounded-lg text-xs font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(clm.id, 'REJECTED', clm.version)}
                        className="p-1.5 bg-rose-950 border border-rose-500/30 text-rose-300 hover:bg-rose-900 rounded-lg text-xs font-semibold"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Submit Claim Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Submit HMO Insurance Claim</h3>

            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div>
                <SearchableSelect
                  label="Select Patient (Searchable)"
                  options={patientOptions}
                  value={claimForm.patientId}
                  onChange={(val) => setClaimForm({ ...claimForm, patientId: val })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">HMO / Insurer Provider</label>
                  <select
                    value={claimForm.hmoProvider}
                    onChange={(e) => setClaimForm({ ...claimForm, hmoProvider: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    {hmoProviders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Policy / Member ID</label>
                  <input
                    type="text"
                    required
                    value={claimForm.policyNumber}
                    onChange={(e) => setClaimForm({ ...claimForm, policyNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Pre-Auth Code</label>
                  <input
                    type="text"
                    value={claimForm.preAuthCode}
                    onChange={(e) => setClaimForm({ ...claimForm, preAuthCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Claim Amount</label>
                  <input
                    type="number"
                    required
                    value={claimForm.claimAmount}
                    onChange={(e) => setClaimForm({ ...claimForm, claimAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Co-Pay Amount</label>
                  <input
                    type="number"
                    value={claimForm.copayAmount}
                    onChange={(e) => setClaimForm({ ...claimForm, copayAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
