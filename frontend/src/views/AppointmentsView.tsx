import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, CheckCircle2, UserCheck, Stethoscope, AlertCircle, X, RotateCcw, Ban, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ExportOptions } from '../components/common/ExportOptions';
import { SearchableSelect, Option } from '../components/common/SearchableSelect';

interface AppointmentsViewProps {
  onNavigateToEmr?: (patientId: string) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ onNavigateToEmr }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().slice(0, 16),
    notes: 'Routine Consultation Follow-up',
  });

  const [rescheduleData, setRescheduleData] = useState({
    appointmentDate: new Date().toISOString().slice(0, 16),
    doctorId: '',
    notes: '',
  });

  const [checkInDoctorId, setCheckInDoctorId] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appRes, patRes, userRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients'),
        api.get('/users'),
      ]);
      setAppointments(appRes.data);
      setPatients(patRes.data);

      const docs = userRes.data.filter((u: any) => u.role === 'DOCTOR' || u.role === 'ADMIN');
      setDoctors(docs);

      if (patRes.data.length > 0) {
        setFormData((prev) => ({ ...prev, patientId: patRes.data[0].id }));
      }
    } catch (err: any) {
      showToast('error', 'Error Loading Appointments', err.message);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      showToast('warning', 'Missing Patient', 'Please select a patient.');
      return;
    }
    try {
      const selectedDoc = doctors.find((d) => d.id === formData.doctorId);
      await api.post('/appointments', {
        patientId: formData.patientId,
        doctorId: formData.doctorId || undefined,
        doctorName: selectedDoc ? selectedDoc.fullName : 'Unassigned Physician',
        appointmentDate: formData.appointmentDate,
        notes: formData.notes,
      });
      showToast('success', 'Appointment Scheduled', 'Confirmation dispatched.');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Booking Failed', err.response?.data?.message || err.message);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    try {
      const selectedDoc = doctors.find((d) => d.id === rescheduleData.doctorId);
      await api.put(`/appointments/${selectedAppointment.id}/reschedule`, {
        appointmentDate: rescheduleData.appointmentDate,
        doctorId: rescheduleData.doctorId || undefined,
        doctorName: selectedDoc ? selectedDoc.fullName : undefined,
        notes: rescheduleData.notes,
        version: selectedAppointment.version,
      });
      showToast('success', 'Appointment Rescheduled', 'Notification dispatched.');
      setIsRescheduleModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Reschedule Failed', err.response?.data?.message || err.message);
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    try {
      const selectedDoc = doctors.find((d) => d.id === checkInDoctorId);
      await api.put(`/appointments/${selectedAppointment.id}/status`, {
        status: 'CHECKED_IN',
        version: selectedAppointment.version,
        doctorId: checkInDoctorId || undefined,
        doctorName: selectedDoc ? selectedDoc.fullName : undefined,
      });
      showToast('success', 'Patient Checked In', `Patient moved to Triage. Doctor: ${selectedDoc ? selectedDoc.fullName : 'Unassigned'}`);
      setIsCheckInModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Check-In Failed', err.response?.data?.message || err.message);
    }
  };

  const handleCancelAppointment = async (id: string, version: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${id}/cancel`, { reason: 'Patient cancellation request', version });
      showToast('success', 'Appointment Cancelled', 'Assigned physician notified.');
      fetchData();
    } catch (err: any) {
      showToast('error', 'Cancellation Failed', err.response?.data?.message || err.message);
    }
  };

  const handleUpdateStage = async (id: string, status: string, version: number) => {
    try {
      await api.put(`/appointments/${id}/status`, { status, version });
      showToast('success', 'Queue Stage Updated', `Patient progressed to ${status}`);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Stage Update Failed', err.response?.data?.message || err.message);
    }
  };

  const patientOptions: Option[] = patients.map((p) => ({
    value: p.id,
    label: p.fullName,
    subLabel: `${p.mrn} • Phone: ${p.phone}`,
  }));

  const doctorOptions: Option[] = [
    { value: '', label: 'Unassigned / General Duty Physician', subLabel: 'No specific physician assigned' },
    ...doctors.map((d) => ({
      value: d.id,
      label: d.fullName,
      subLabel: `${d.role} • ${d.email}`,
    })),
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-950 text-blue-300 border-blue-500/30';
      case 'CHECKED_IN':
        return 'bg-amber-950 text-amber-300 border-amber-500/30';
      case 'TRIAGED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/30';
      case 'IN_CONSULTATION':
        return 'bg-purple-950 text-purple-300 border-purple-500/30';
      case 'COMPLETED':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'CANCELLED':
        return 'bg-rose-950 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Clinical Appointments & Patient Queue</h2>
          <p className="text-xs text-slate-400">Direct Doctor Consultation pickup & Check-in physician assignment</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={appointments} filename="hms_appointments_queue" />
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Time Slot</th>
              <th className="p-4">Patient Name</th>
              <th className="p-4">Assigned Doctor</th>
              <th className="p-4">Stage Status</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Actions & Stage Progression</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {appointments.map((app) => (
              <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-mono text-xs text-cyan-400 font-bold">
                  {new Date(app.appointmentDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="p-4 font-medium text-white">{app.patientName}</td>
                <td className="p-4 text-slate-300 text-xs">{app.doctorName || 'Unassigned Physician'}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(app.status)}`}>
                    {app.status}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-500">v{app.version}</td>
                <td className="p-4 text-right space-x-2">
                  {app.status === 'SCHEDULED' && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedAppointment(app);
                          setCheckInDoctorId(app.doctorId || '');
                          setIsCheckInModalOpen(true);
                        }}
                        className="p-1.5 bg-amber-950 border border-amber-500/30 text-amber-300 hover:bg-amber-900 rounded-lg text-xs font-semibold"
                      >
                        Check In & Assign Doctor
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAppointment(app);
                          setRescheduleData({
                            appointmentDate: app.appointmentDate,
                            doctorId: app.doctorId || '',
                            notes: app.reason || '',
                          });
                          setIsRescheduleModalOpen(true);
                        }}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reschedule
                      </button>
                    </>
                  )}

                  {/* Direct Doctor Pickup Button */}
                  {(app.status === 'SCHEDULED' || app.status === 'CHECKED_IN' || app.status === 'TRIAGED') && onNavigateToEmr && (
                    <button
                      onClick={() => {
                        handleUpdateStage(app.id, 'IN_CONSULTATION', app.version);
                        onNavigateToEmr(app.patientId);
                      }}
                      className="p-1.5 bg-purple-950 border border-purple-500/40 text-purple-300 hover:bg-purple-900 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm"
                      title="Doctor Direct Pickup into EMR Consultation"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-purple-400" />
                      Direct Doctor Pickup
                    </button>
                  )}

                  {app.status === 'CHECKED_IN' && (
                    <button
                      onClick={() => handleUpdateStage(app.id, 'TRIAGED', app.version)}
                      className="p-1.5 bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900 rounded-lg text-xs font-semibold"
                    >
                      Complete Triage
                    </button>
                  )}
                  {app.status === 'IN_CONSULTATION' && (
                    <button
                      onClick={() => handleUpdateStage(app.id, 'COMPLETED', app.version)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                    >
                      Complete Visit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Book Appointment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Book Patient Appointment</h3>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <SearchableSelect
                  label="Select Patient (Searchable)"
                  options={patientOptions}
                  value={formData.patientId}
                  onChange={(val) => setFormData({ ...formData, patientId: val })}
                  placeholder="Search patient..."
                />
              </div>

              <div>
                <SearchableSelect
                  label="Assigned Physician (Optional Dropdown)"
                  options={doctorOptions}
                  value={formData.doctorId}
                  onChange={(val) => setFormData({ ...formData, doctorId: val })}
                  placeholder="Select doctor (Optional)..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Appointment Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Notes / Reason for Visit</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
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
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check In & Assign Doctor Modal */}
      {isCheckInModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsCheckInModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Check In Patient</h3>
            <p className="text-xs text-slate-400 mb-4">Patient: {selectedAppointment.patientName}</p>

            <form onSubmit={handleCheckInSubmit} className="space-y-4">
              <div>
                <SearchableSelect
                  label="Assign / Reassign Attending Doctor"
                  options={doctorOptions}
                  value={checkInDoctorId}
                  onChange={(val) => setCheckInDoctorId(val)}
                  placeholder="Select physician..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg shadow-amber-950"
                >
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {isRescheduleModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsRescheduleModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Reschedule Appointment</h3>
            <p className="text-xs text-slate-400 mb-4">Patient: {selectedAppointment.patientName}</p>

            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">New Appointment Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={rescheduleData.appointmentDate}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, appointmentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Reassign Physician (Optional)"
                  options={doctorOptions}
                  value={rescheduleData.doctorId}
                  onChange={(val) => setRescheduleData({ ...rescheduleData, doctorId: val })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950"
                >
                  Save Rescheduled Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
