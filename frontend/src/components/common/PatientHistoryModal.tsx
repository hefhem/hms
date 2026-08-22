import React, { useEffect, useState } from 'react';
import { History, HeartPulse, Stethoscope, Pill, CreditCard, X, Calendar, User } from 'lucide-react';
import api from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

interface PatientHistoryModalProps {
  patient: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PatientHistoryModal: React.FC<PatientHistoryModalProps> = ({ patient, isOpen, onClose }) => {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'consultations' | 'vitals' | 'invoices'>('consultations');
  const { formatCurrency } = useSettings();

  useEffect(() => {
    if (patient && isOpen) {
      fetchPatientTimeline(patient.id);
    }
  }, [patient, isOpen]);

  const fetchPatientTimeline = async (patientId: string) => {
    try {
      const [cRes, iRes] = await Promise.all([
        api.get(`/emr/patient/${patientId}/consultations`),
        api.get('/billing/invoices', { params: { patientId } }),
      ]);
      setConsultations(cRes.data);
      setInvoices(iRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 bg-slate-800 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Patient Header Banner */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {patient.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{patient.fullName}</h3>
              <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                {patient.mrn}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {patient.gender} • DOB: {patient.dateOfBirth} • Phone: {patient.phone} • Blood: {patient.bloodGroup}
            </p>
            {patient.allergies && (
              <span className="inline-block text-[11px] text-rose-400 font-medium mt-1">
                ⚠️ Allergies: {patient.allergies}
              </span>
            )}
          </div>
        </div>

        {/* Timeline Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('consultations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'consultations'
                ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-purple-400" />
            Clinical Consultations ({consultations.length})
          </button>
          <button
            onClick={() => setActiveTab('vitals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'vitals'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-emerald-400" />
            Triage Vitals ({patient.triages?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'invoices'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            <CreditCard className="w-4 h-4 text-cyan-400" />
            Financial Invoices ({invoices.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'consultations' && (
            consultations.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No clinical consultation notes recorded yet.</p>
            ) : (
              consultations.map((c) => (
                <div key={c.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                    <span className="text-purple-400 font-semibold">{c.doctorName}</span>
                  </div>
                  <h4 className="text-sm font-bold text-cyan-300">{c.diagnosis}</h4>
                  <div className="text-xs text-slate-300">
                    <strong>Chief Complaint:</strong> {c.chiefComplaint}
                  </div>
                  {c.clinicalNotes && (
                    <div className="text-xs text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                      <strong>Clinical Notes:</strong> {c.clinicalNotes}
                    </div>
                  )}
                </div>
              ))
            )
          )}

          {activeTab === 'vitals' && (
            (!patient.triages || patient.triages.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-10">No triage vital recordings logged yet.</p>
            ) : (
              patient.triages.map((t: any) => (
                <div key={t.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono">{new Date(t.createdAt).toLocaleString()}</span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                      {t.triageCategory}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 text-center text-xs">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">BP</span>
                      <span className="font-bold text-white">{t.bloodPressure}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Temp</span>
                      <span className="font-bold text-white">{t.temperature}°C</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Pulse</span>
                      <span className="font-bold text-white">{t.pulseRate} bpm</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">SpO2</span>
                      <span className="font-bold text-white">{t.spo2}%</span>
                    </div>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'invoices' && (
            invoices.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No financial invoices found.</p>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-cyan-400 block">{inv.invoiceNumber}</span>
                    <span className="text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 block">{formatCurrency(inv.finalAmount)}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{inv.paymentStatus}</span>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
