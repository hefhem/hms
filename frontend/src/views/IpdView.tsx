import React, { useEffect, useState } from 'react';
import { Bed, UserPlus, LogOut, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { ExportOptions } from '../components/common/ExportOptions';
import { SearchableSelect, Option } from '../components/common/SearchableSelect';

export const IpdView: React.FC = () => {
  const [beds, setBeds] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);

  const { formatCurrency } = useSettings();
  const { showToast } = useToast();

  const [admitForm, setAdmitForm] = useState({
    patientId: '',
    bedId: '',
    reason: 'Inpatient Care & Monitoring',
  });

  const [dischargeSummary, setDischargeSummary] = useState('Patient recovered satisfactorily. Fit for discharge with take-home prescriptions.');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bRes, aRes, pRes] = await Promise.all([
        api.get('/ipd/beds'),
        api.get('/ipd/admissions'),
        api.get('/patients'),
      ]);
      setBeds(bRes.data);
      setAdmissions(aRes.data);
      setPatients(pRes.data);
      const vacantBeds = bRes.data.filter((b: any) => b.status === 'VACANT');
      if (pRes.data.length > 0 && vacantBeds.length > 0) {
        setAdmitForm((prev) => ({ ...prev, patientId: pRes.data[0].id, bedId: vacantBeds[0].id }));
      }
    } catch (err: any) {
      showToast('error', 'Error Loading IPD Data', err.message);
    }
  };

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitForm.patientId || !admitForm.bedId) {
      showToast('warning', 'Missing Selection', 'Select both patient and vacant bed.');
      return;
    }
    try {
      await api.post('/ipd/admissions', admitForm);
      showToast('success', 'Patient Admitted', 'Bed reserved & initial deposit added to billing.');
      setIsAdmitModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Admission Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    try {
      await api.put(`/ipd/admissions/${selectedAdmission.id}/discharge`, {
        dischargeSummary,
      });
      showToast('success', 'Patient Discharged', `Admission ${selectedAdmission.admissionNumber} closed & bed freed.`);
      setIsDischargeModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Discharge Failed', err.response?.data?.message || err.message);
    }
  };

  const patientOptions: Option[] = patients.map((p) => ({
    value: p.id,
    label: p.fullName,
    subLabel: `${p.mrn} • Phone: ${p.phone}`,
  }));

  const vacantBeds = beds.filter((b) => b.status === 'VACANT');

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Inpatient Department (IPD) & Ward Bed Board</h2>
          <p className="text-xs text-slate-400">Real-time bed census, patient admission, transfers & discharge summaries</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={admissions} filename="hms_ipd_admissions" />
          <button
            onClick={() => setIsAdmitModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Admit Patient
          </button>
        </div>
      </div>

      {/* Bed Board Visual Grid */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base">Real-Time Ward Bed Board Census</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {beds.map((b) => {
            const isVacant = b.status === 'VACANT';
            return (
              <div
                key={b.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isVacant
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-rose-950/40 border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-cyan-400 text-sm">{b.bedNumber}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isVacant
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-medium truncate">{b.wardName}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-1">{formatCurrency(b.pricePerNight)} / night</div>

                {!isVacant && b.currentPatientName && (
                  <div className="mt-3 pt-2 border-t border-rose-500/20 text-xs">
                    <span className="text-slate-400 block text-[10px]">Patient Occupant:</span>
                    <span className="font-bold text-white block truncate">{b.currentPatientName}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Admissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800">
          <h3 className="font-bold text-white text-base">Inpatient Admissions Register</h3>
        </div>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Admission #</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">Bed Assigned</th>
              <th className="p-4">Attending Doctor</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {admissions.map((adm) => (
              <tr key={adm.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-mono font-bold text-cyan-400">{adm.admissionNumber}</td>
                <td className="p-4 font-medium text-white">{adm.patientName}</td>
                <td className="p-4 font-mono text-xs text-amber-400 font-bold">{adm.bedNumber}</td>
                <td className="p-4 text-slate-300 text-xs">{adm.attendingDoctor}</td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      adm.status === 'ADMITTED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {adm.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {adm.status === 'ADMITTED' && (
                    <button
                      onClick={() => {
                        setSelectedAdmission(adm);
                        setIsDischargeModalOpen(true);
                      }}
                      className="p-1.5 bg-rose-950 border border-rose-500/30 text-rose-300 hover:bg-rose-900 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Discharge Patient
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Admit Patient Modal */}
      {isAdmitModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsAdmitModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Admit Patient to IPD Ward</h3>

            <form onSubmit={handleAdmit} className="space-y-4">
              <div>
                <SearchableSelect
                  label="Select Patient (Searchable)"
                  options={patientOptions}
                  value={admitForm.patientId}
                  onChange={(val) => setAdmitForm({ ...admitForm, patientId: val })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Vacant Bed</label>
                <select
                  required
                  value={admitForm.bedId}
                  onChange={(e) => setAdmitForm({ ...admitForm, bedId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                >
                  <option value="">-- Choose Vacant Bed --</option>
                  {vacantBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} - {b.wardName} ({formatCurrency(b.pricePerNight)}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Admission Reason</label>
                <input
                  type="text"
                  required
                  value={admitForm.reason}
                  onChange={(e) => setAdmitForm({ ...admitForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdmitModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950"
                >
                  Confirm Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Summary Modal */}
      {isDischargeModalOpen && selectedAdmission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsDischargeModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Discharge Patient & Generate Summary</h3>
            <p className="text-xs text-slate-400 mb-4">Patient: {selectedAdmission.patientName} ({selectedAdmission.bedNumber})</p>

            <form onSubmit={handleDischarge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Discharge Summary Notes</label>
                <textarea
                  rows={4}
                  required
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDischargeModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-950"
                >
                  Finalize Discharge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
