import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Shield, KeyRound, CheckCircle2, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const UsersManagementView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'DOCTOR',
    password: 'Admin@123456',
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err: any) {
      showToast('error', 'Error Loading Staff Users', err.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      showToast('success', 'Staff Member Registered', `User ${formData.fullName} onboarded as ${formData.role}.`);
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.response?.data?.message || err.message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      showToast('success', 'Role Updated', `User role reassigned to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Role Update Failed', err.response?.data?.message || err.message);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-950 text-purple-300 border-purple-500/40';
      case 'DOCTOR':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500/40';
      case 'NURSE':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/40';
      case 'PHARMACIST':
        return 'bg-amber-950 text-amber-300 border-amber-500/40';
      case 'RECEPTIONIST':
        return 'bg-blue-950 text-blue-300 border-blue-500/40';
      case 'BILLING_CLERK':
        return 'bg-pink-950 text-pink-300 border-pink-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">User Roles & Staff Access Assignment</h2>
          <p className="text-xs text-slate-400">Onboard hospital staff, reassign RBAC permission roles & manage MFA credentials</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={users} filename="hms_staff_directory" />
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Onboard Staff Member
          </button>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Staff Member Name</th>
              <th className="p-4">Email Address</th>
              <th className="p-4">Current Role</th>
              <th className="p-4">MFA Security</th>
              <th className="p-4">Version</th>
              <th className="p-4 text-right">Reassign Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
                    {u.fullName?.charAt(0) || 'U'}
                  </div>
                  <span>{u.fullName}</span>
                </td>
                <td className="p-4 font-mono text-xs text-cyan-400">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getRoleBadge(u.role)}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.mfaEnabled
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {u.mfaEnabled ? 'MFA ACTIVE' : 'MFA OFF'}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-500">v{u.version || 1}</td>
                <td className="p-4 text-right">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="NURSE">NURSE</option>
                    <option value="PHARMACIST">PHARMACIST</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="BILLING_CLERK">BILLING_CLERK</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Onboard Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Onboard Hospital Staff Member</h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name & Credentials</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Evelyn Reed (MD)"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="evelyn@clinic.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assign Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="DOCTOR">DOCTOR</option>
                    <option value="NURSE">NURSE</option>
                    <option value="PHARMACIST">PHARMACIST</option>
                    <option value="RECEPTIONIST">RECEPTIONIST</option>
                    <option value="BILLING_CLERK">BILLING_CLERK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Default Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
