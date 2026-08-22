import React, { useEffect, useState } from 'react';
import { Search, UserPlus, Upload, HeartPulse, Edit, Eye, X, History } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ExportOptions } from '../components/common/ExportOptions';
import { ImportCsvModal } from '../components/common/ImportCsvModal';
import { PatientHistoryModal } from '../components/common/PatientHistoryModal';

export const PatientsView: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    bloodGroup: 'O+',
    allergies: '',
  });

  // Triage State
  const [triageData, setTriageData] = useState({
    temperature: 37.0,
    bloodPressure: '120/80',
    pulseRate: 72,
    respiratoryRate: 16,
    spo2: 98,
    weight: 70,
    height: 175,
    notes: '',
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients', { params: { search } });
      setPatients(res.data);
    } catch (err: any) {
      showToast('error', 'Error Loading Patients', err.message);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedPatient) {
        await api.put(`/patients/${selectedPatient.id}`, {
          ...formData,
          version: selectedPatient.version,
        });
        showToast('success', 'Patient Updated', 'Record saved with version lock.');
      } else {
        await api.post('/patients', formData);
        showToast('success', 'Patient Registered', 'New MRN auto-generated.');
      }
      setIsAddModalOpen(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (err: any) {
      showToast('error', 'Save Failed', err.response?.data?.message || err.message);
    }
  };

  const handleRecordTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await api.post(`/patients/${selectedPatient.id}/triage`, triageData);
      showToast('success', 'Triage Vitals Recorded', `Patient ${selectedPatient.fullName} vitals updated.`);
      setIsTriageModalOpen(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (err: any) {
      showToast('error', 'Triage Recording Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name, MRN, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <ExportOptions data={patients} filename="hms_patient_directory" label="Export CSV" />
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            Import CSV
          </button>
          <button
            onClick={() => {
              setSelectedPatient(null);
              setFormData({
                fullName: '',
                gender: 'Male',
                dateOfBirth: '1990-01-01',
                phone: '',
                email: '',
                address: '',
                bloodGroup: 'O+',
                allergies: '',
              });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Register Patient
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">MRN</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">Gender & Age</th>
              <th className="p-4">Contact Phone</th>
              <th className="p-4">Blood Group</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-mono font-bold text-cyan-400">{p.mrn}</td>
                <td className="p-4 font-medium text-white">
                  {p.fullName}
                  {p.allergies && (
                    <span className="block text-[11px] text-rose-400 mt-0.5">Allergies: {p.allergies}</span>
                  )}
                </td>
                <td className="p-4 text-slate-300">
                  {p.gender} ({p.dateOfBirth})
                </td>
                <td className="p-4 text-slate-300">{p.phone}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 bg-red-950/80 border border-red-500/30 text-red-300 text-xs font-bold rounded-lg">
                    {p.bloodGroup}
                  </span>
                </td>
                <td className="p-4 text-xs font-mono text-slate-500">v{p.version}</td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => {
                      setSelectedPatient(p);
                      setIsHistoryModalOpen(true);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                    title="View Full Medical History"
                  >
                    <History className="w-3.5 h-3.5 text-purple-400" />
                    History
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(p);
                      setIsTriageModalOpen(true);
                    }}
                    className="p-1.5 bg-emerald-950 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                    title="Record Triage Vitals"
                  >
                    <HeartPulse className="w-3.5 h-3.5" />
                    Triage
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPatient(p);
                      setFormData({
                        fullName: p.fullName,
                        gender: p.gender,
                        dateOfBirth: p.dateOfBirth,
                        phone: p.phone,
                        email: p.email || '',
                        address: p.address || '',
                        bloodGroup: p.bloodGroup,
                        allergies: p.allergies || '',
                      });
                      setIsAddModalOpen(true);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                    title="Edit Patient Record"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Register / Edit Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {selectedPatient ? 'Edit Patient Record' : 'Register New Patient'}
            </h3>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Triage Vitals Modal */}
      {isTriageModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsTriageModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Record Triage Vitals</h3>
            <p className="text-xs text-slate-400 mb-4">Patient: {selectedPatient.fullName} ({selectedPatient.mrn})</p>

            <form onSubmit={handleRecordTriage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    required
                    value={triageData.bloodPressure}
                    onChange={(e) => setTriageData({ ...triageData, bloodPressure: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={triageData.temperature}
                    onChange={(e) => setTriageData({ ...triageData, temperature: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    required
                    value={triageData.pulseRate}
                    onChange={(e) => setTriageData({ ...triageData, pulseRate: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    required
                    value={triageData.spo2}
                    onChange={(e) => setTriageData({ ...triageData, spo2: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Resp. Rate</label>
                  <input
                    type="number"
                    required
                    value={triageData.respiratoryRate}
                    onChange={(e) => setTriageData({ ...triageData, respiratoryRate: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={triageData.weight}
                    onChange={(e) => setTriageData({ ...triageData, weight: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={triageData.height}
                    onChange={(e) => setTriageData({ ...triageData, height: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsTriageModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950"
                >
                  Save Triage Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchPatients}
      />

      {/* Patient History Modal */}
      <PatientHistoryModal
        patient={selectedPatient}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
};
