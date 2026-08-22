import React, { useEffect, useState } from 'react';
import { Stethoscope, Pill, Plus, Trash2, CheckCircle2, History, RotateCcw, TestTube, ReceiptText, ChevronRight, X, Sparkles, ShieldAlert, Activity, PauseCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { SearchableSelect, Option } from '../components/common/SearchableSelect';
import { useSettings } from '../context/SettingsContext';

export const EmrView: React.FC<{ initialPatientId?: string }> = ({ initialPatientId }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [masterServices, setMasterServices] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [pastConsultations, setPastConsultations] = useState<any[]>([]);
  const [parkedConsultations, setParkedConsultations] = useState<any[]>([]);
  const [parkedConsultationId, setParkedConsultationId] = useState<string>('');
  const [aiBriefing, setAiBriefing] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const { formatCurrency } = useSettings();

  // Consultation Form
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hpi, setHpi] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [icdCode, setIcdCode] = useState('');

  // Orders requested during consultation
  const [selectedLabOrders, setSelectedLabOrders] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Prescriptions List
  const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);

  const { showToast } = useToast();

  useEffect(() => {
    fetchInitialData();
    fetchParkedConsultations();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientHistory(selectedPatientId);
      fetchAiBriefing(selectedPatientId);
    } else {
      setPastConsultations([]);
      setAiBriefing(null);
    }
  }, [selectedPatientId]);

  const fetchInitialData = async () => {
    try {
      const [patRes, drugRes, srvRes] = await Promise.all([
        api.get('/patients'),
        api.get('/pharmacy/drugs'),
        api.get('/services', { params: { isActive: true } }),
      ]);
      setPatients(patRes.data);
      setDrugs(drugRes.data);
      setMasterServices(srvRes.data);
      if (patRes.data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patRes.data[0].id);
      }
    } catch (err: any) {
      showToast('error', 'Error Loading EMR Data', err.message);
    }
  };

  const fetchPatientHistory = async (patientId: string) => {
    try {
      const res = await api.get(`/emr/patient/${patientId}/consultations`);
      setPastConsultations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchParkedConsultations = async () => {
    try {
      const res = await api.get('/emr/consultations/parked');
      setParkedConsultations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleParkConsultation = async () => {
    if (!selectedPatientId) {
      showToast('warning', 'Missing Patient', 'Select a patient to park consultation.');
      return;
    }
    try {
      await api.post('/emr/consultations/park', {
        patientId: selectedPatientId,
        chiefComplaint,
        hpi,
        clinicalNotes,
        diagnosis,
        icdCode,
        labOrdersRequested: selectedLabOrders,
        serviceItemIdsRequested: selectedServices,
      });
      showToast('success', 'Consultation Parked', 'Consultation saved on hold. Patient moved to Awaiting Lab Queue.');
      // Reset form
      setChiefComplaint('');
      setHpi('');
      setClinicalNotes('');
      setDiagnosis('');
      setIcdCode('');
      setSelectedLabOrders([]);
      setSelectedServices([]);
      setPrescriptionItems([]);
      setParkedConsultationId('');
      fetchParkedConsultations();
    } catch (err: any) {
      showToast('error', 'Parking Failed', err.response?.data?.message || err.message);
    }
  };

  const resumeParkedConsultation = (parked: any) => {
    setSelectedPatientId(parked.patientId);
    setParkedConsultationId(parked.id);
    setChiefComplaint(parked.chiefComplaint || '');
    setHpi(parked.hpi || '');
    setDiagnosis(parked.diagnosis || '');
    setIcdCode(parked.icdCode || '');
    setClinicalNotes(parked.clinicalNotes || '');
    if (parked.labOrdersRequested) setSelectedLabOrders(parked.labOrdersRequested);
    showToast('success', 'Consultation Resumed', `Resumed parked session for ${parked.patientName}`);
  };

  const fetchAiBriefing = async (patientId: string) => {
    setLoadingAi(true);
    try {
      const res = await api.get(`/emr/patient/${patientId}/ai-briefing`);
      setAiBriefing(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  const recallConsultation = (past: any) => {
    setChiefComplaint(past.chiefComplaint || '');
    setHpi(past.hpi || '');
    setDiagnosis(past.diagnosis || '');
    setIcdCode(past.icdCode || '');
    setClinicalNotes(past.clinicalNotes ? `[Recalled Notes from ${new Date(past.createdAt).toLocaleDateString()}]: ${past.clinicalNotes}` : '');
    showToast('success', 'Consultation Recalled', `Notes recalled from consultation on ${new Date(past.createdAt).toLocaleDateString()}`);
  };

  const addPrescriptionItem = (drugId: string) => {
    const d = drugs.find((item) => item.id === drugId);
    if (!d) return;

    setPrescriptionItems([
      ...prescriptionItems,
      {
        drugId: d.id,
        drugName: d.name,
        dosage: '500mg',
        frequency: 'TDS (3x Daily)',
        duration: '5 Days',
        quantity: 15,
      },
    ]);
  };

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  const toggleLabOrder = (testName: string) => {
    if (selectedLabOrders.includes(testName)) {
      setSelectedLabOrders(selectedLabOrders.filter((t) => t !== testName));
    } else {
      setSelectedLabOrders([...selectedLabOrders, testName]);
    }
  };

  const toggleServiceItem = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((s) => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      showToast('warning', 'Missing Patient', 'Please select a patient.');
      return;
    }
    if (!chiefComplaint || !diagnosis) {
      showToast('warning', 'Missing Clinical Details', 'Chief complaint and diagnosis are required.');
      return;
    }

    try {
      await api.post('/emr/consultations', {
        patientId: selectedPatientId,
        chiefComplaint,
        hpi,
        clinicalNotes,
        diagnosis,
        icdCode,
        labOrdersRequested: selectedLabOrders,
        serviceItemIdsRequested: selectedServices,
        prescriptions: prescriptionItems,
      });

      showToast(
        'success',
        'Consultation Finalized',
        'EMR consultation notes saved. Lab orders dispatched to LIS & invoice generated.',
      );

      // Reset Form
      setChiefComplaint('');
      setHpi('');
      setClinicalNotes('');
      setDiagnosis('');
      setIcdCode('');
      setSelectedLabOrders([]);
      setSelectedServices([]);
      setPrescriptionItems([]);
      fetchPatientHistory(selectedPatientId);
    } catch (err: any) {
      showToast('error', 'Submission Failed', err.response?.data?.message || err.message);
    }
  };

  // Convert data lists to SearchableSelect Options
  const patientOptions: Option[] = patients.map((p) => ({
    value: p.id,
    label: p.fullName,
    subLabel: `${p.mrn} • DOB: ${p.dateOfBirth} • Blood: ${p.bloodGroup}`,
  }));

  const drugOptions: Option[] = drugs.map((d) => ({
    value: d.id,
    label: d.name,
    subLabel: `${d.code} • Stock: ${d.quantityInStock} ${d.unit} • ${formatCurrency(d.unitPrice)}`,
  }));

  const serviceOptions: Option[] = masterServices.map((s) => ({
    value: s.id,
    label: s.name,
    subLabel: `[${s.category}] ${s.code} • ${formatCurrency(s.price)}`,
  }));

  const commonLabPanels = [
    'Complete Blood Count (CBC Panel)',
    'Lipid Profile Panel',
    'Comprehensive Metabolic Panel (CMP)',
    'Urinalysis Routine',
    'Thyroid Function Test (TSH, T3, T4)',
    'Widal Typhoid Screen',
  ];

  const commonIcd10Codes: Option[] = [
    { value: 'J06.9', label: 'Acute upper respiratory infection, unspecified', subLabel: 'ICD-10 J06.9' },
    { value: 'I10', label: 'Essential (primary) hypertension', subLabel: 'ICD-10 I10' },
    { value: 'E11.9', label: 'Type 2 diabetes mellitus without complications', subLabel: 'ICD-10 E11.9' },
    { value: 'K21.9', label: 'Gastro-esophageal reflux disease without esophagitis', subLabel: 'ICD-10 K21.9' },
    { value: 'J45.909', label: 'Unspecified asthma, uncomplicated', subLabel: 'ICD-10 J45.909' },
    { value: 'N39.0', label: 'Urinary tract infection, site not specified', subLabel: 'ICD-10 N39.0' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Active Consultation Workspace (8 Columns) */}
      <div className="lg:col-span-8 space-y-6">
        <form onSubmit={handleSubmitConsultation} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-950 border border-purple-500/30 rounded-xl text-purple-400">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Doctor Clinical Consultation Workspace</h3>
                <p className="text-xs text-slate-400">E-Prescriptions, LIS Lab Ordering, and Procedure Billing</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleParkConsultation}
                className="px-4 py-2.5 bg-amber-950 border border-amber-500/40 hover:bg-amber-900 text-amber-300 font-semibold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
                title="Park session on hold while patient undergoes Lab/Radiology testing"
              >
                <PauseCircle className="w-4 h-4 text-amber-400" />
                Park (Hold for Lab/Rad)
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalize Consultation Notes
              </button>
            </div>
          </div>

          {/* Patient Selector */}
          <div>
            <SearchableSelect
              label="Select Active Consultation Patient"
              options={patientOptions}
              value={selectedPatientId}
              onChange={(val) => setSelectedPatientId(val)}
              placeholder="Search patient by Name, MRN or Phone..."
            />
          </div>

          {/* Safe Clinical AI Patient Briefing & Recurrence Intelligence Card */}
          {aiBriefing && (
            <div className="bg-slate-950 border border-purple-500/30 p-4 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">Clinical AI Patient Briefing & Recurrence Risk Analysis</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                    aiBriefing.riskLevel === 'HIGH'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                      : aiBriefing.riskLevel === 'MODERATE'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  Risk Status: {aiBriefing.riskLevel}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-sans">
                {aiBriefing.aiSummary}
              </p>

              {aiBriefing.riskAlerts && aiBriefing.riskAlerts.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {aiBriefing.riskAlerts.map((alert: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 bg-amber-950/50 border border-amber-500/30 text-amber-300 rounded-lg text-[11px] font-medium flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      {alert}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Clinical Notes & HPI Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Chief Complaint *</label>
              <input
                type="text"
                required
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="e.g. High fever, persistent cough for 3 days"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Diagnosis Title *</label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Upper Respiratory Tract Infection"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
            </div>
          </div>

          {/* ICD-10 Searchable Selector */}
          <div>
            <SearchableSelect
              label="ICD-10 Diagnosis Coding (Searchable)"
              options={commonIcd10Codes}
              value={icdCode}
              onChange={(val) => {
                setIcdCode(val);
                const match = commonIcd10Codes.find((i) => i.value === val);
                if (match && !diagnosis) setDiagnosis(match.label);
              }}
              placeholder="Search ICD-10 code or medical description..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">History of Present Illness (HPI)</label>
            <textarea
              rows={2}
              value={hpi}
              onChange={(e) => setHpi(e.target.value)}
              placeholder="Detailed chronological description of the progression of patient symptoms..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Clinical Notes & Physical Examination</label>
            <textarea
              rows={2}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Physical exam findings, chest auscultation, abdominal palpation..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          {/* Integrated Laboratory Investigation Ordering */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <TestTube className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Order Laboratory Investigations (LIS)</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {commonLabPanels.map((panel) => {
                const isSelected = selectedLabOrders.includes(panel);
                return (
                  <button
                    key={panel}
                    type="button"
                    onClick={() => toggleLabOrder(panel)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    + {panel.split(' (')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Integrated Procedure & Service Master Selector */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Billable Procedures & Services Master</h4>
              </div>
            </div>

            <SearchableSelect
              options={serviceOptions}
              value=""
              onChange={(val) => {
                if (val) toggleServiceItem(val);
              }}
              placeholder="Search and add clinical procedure / service from Master Catalog..."
            />

            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedServices.map((srvId) => {
                  const srv = masterServices.find((s) => s.id === srvId);
                  if (!srv) return null;
                  return (
                    <span key={srvId} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950 border border-purple-500/30 text-purple-300 text-xs font-bold">
                      {srv.name} ({formatCurrency(srv.price)})
                      <button type="button" onClick={() => toggleServiceItem(srvId)} className="hover:text-rose-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Electronic Prescription Builder */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Electronic Prescription (Rx)</h4>
              </div>
            </div>

            <SearchableSelect
              options={drugOptions}
              value=""
              onChange={(val) => {
                if (val) addPrescriptionItem(val);
              }}
              placeholder="Search drug inventory catalog to add medication..."
            />

            {prescriptionItems.length > 0 && (
              <div className="space-y-2 pt-2">
                {prescriptionItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800 items-center">
                    <span className="col-span-4 font-bold text-xs text-cyan-300 truncate">{item.drugName}</span>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => {
                        const updated = [...prescriptionItems];
                        updated[index].dosage = e.target.value;
                        setPrescriptionItems(updated);
                      }}
                      className="col-span-3 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                      placeholder="Dosage"
                    />
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) => {
                        const updated = [...prescriptionItems];
                        updated[index].frequency = e.target.value;
                        setPrescriptionItems(updated);
                      }}
                      className="col-span-4 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                      placeholder="Frequency"
                    />
                    <button
                      type="button"
                      onClick={() => removePrescriptionItem(index)}
                      className="col-span-1 text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Patient History & Parked Sessions Drawer (4 Columns) */}
      <div className="lg:col-span-4 space-y-6">
        {/* Parked Consultations Awaiting Lab Results Panel */}
        <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <PauseCircle className="w-4 h-4" />
              <span>Parked Sessions (Hold for Lab/Rad)</span>
            </div>
            <span className="font-mono text-xs text-amber-300 bg-amber-950 px-2 py-0.5 rounded font-bold border border-amber-500/30">
              {parkedConsultations.length} Parked
            </span>
          </div>

          {parkedConsultations.length === 0 ? (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center text-xs text-slate-500">
              No consultations currently parked on hold.
            </div>
          ) : (
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-800/60">
              {parkedConsultations.map((parked) => (
                <div key={parked.id} className="pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{parked.patientName}</span>
                    <span className="text-[10px] text-amber-400 font-mono">PARKED</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 font-mono">
                    Complaint: {parked.chiefComplaint || 'Awaiting Investigation'}
                  </p>

                  <button
                    type="button"
                    onClick={() => resumeParkedConsultation(parked)}
                    className="w-full py-1.5 bg-amber-950/80 border border-amber-500/40 hover:bg-amber-900 text-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Resume Session (Unpark)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Finalized Consultations Panel */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
              <History className="w-4 h-4" />
              <span>Past Finalized Consultations</span>
            </div>
            <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
              {pastConsultations.length} Records
            </span>
          </div>

          {pastConsultations.length === 0 ? (
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 text-center text-xs text-slate-500">
              No previous finalized consultations found for this patient.
            </div>
          ) : (
            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
              {pastConsultations.map((past) => (
                <div key={past.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 relative group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-400">{new Date(past.createdAt).toLocaleDateString()}</span>
                    <span className="text-purple-300 font-semibold">{past.doctorName}</span>
                  </div>

                  <h5 className="text-xs font-bold text-cyan-300">{past.diagnosis}</h5>

                  <p className="text-[11px] text-slate-300 line-clamp-2">
                    <strong>Chief Complaint:</strong> {past.chiefComplaint}
                  </p>

                  {past.clinicalNotes && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                      {past.clinicalNotes}
                    </p>
                  )}

                  {/* Recall Notes Button */}
                  <button
                    type="button"
                    onClick={() => recallConsultation(past)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    Recall Notes into Active Form
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
