import React, { useEffect, useState } from 'react';
import { UserCheck, Plus, Shield, KeyRound, CheckCircle2, X, Edit2, Trash2, Power, Filter, Mail } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ExportOptions } from '../components/common/ExportOptions';

export const UsersManagementView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [resettingUser, setResettingUser] = useState<any>(null);

  // Modals Visibility
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Form States
  const [createForm, setCreateForm] = useState({
    email: '',
    fullName: '',
    role: 'DOCTOR',
    password: 'Admin@123456',
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    role: 'DOCTOR',
    isActive: true,
  });

  const [newPassword, setNewPassword] = useState('Password@2026');

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
      await api.post('/users', createForm);
      showToast('success', 'Staff Member Onboarded', `User ${createForm.fullName} created. Credentials sent via SMTP.`);
      setIsCreateModalOpen(false);
      setCreateForm({ email: '', fullName: '', role: 'DOCTOR', password: 'Admin@123456', isActive: true });
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Registration Failed', err.response?.data?.message || err.message);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.put(`/users/${editingUser.id}`, editForm);
      showToast('success', 'Staff Account Updated', `Updated details for ${editForm.fullName}`);
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.response?.data?.message || err.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/users/${id}/status`, { isActive: !currentStatus });
      showToast('success', 'Staff Status Updated', `Account status set to ${!currentStatus ? 'ACTIVE' : 'INACTIVE'}`);
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Status Change Failed', err.response?.data?.message || err.message);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    try {
      await api.put(`/users/${resettingUser.id}/reset-password`, { newPassword });
      showToast('success', 'Password Reset Successful', `New password set and dispatched via SMTP to ${resettingUser.email}`);
      setIsResetModalOpen(false);
      setResettingUser(null);
      setNewPassword('Password@2026');
    } catch (err: any) {
      showToast('error', 'Password Reset Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDeleteUser = async (id: string, fullName: string) => {
    if (!window.confirm(`Are you sure you want to delete staff account '${fullName}'?`)) return;
    try {
      await api.delete(`/users/${id}`);
      showToast('success', 'Staff User Deleted', 'User record removed.');
      fetchUsers();
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.response?.data?.message || err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filterStatus === 'ACTIVE') return u.isActive !== false;
    if (filterStatus === 'INACTIVE') return u.isActive === false;
    return true;
  });

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
          <h2 className="text-lg font-bold text-white">User Roles & Staff Access Administration</h2>
          <p className="text-xs text-slate-400">Full Staff CRUD, Role Assignment, Active/Inactive Deactivation & Admin Password Reset</p>
        </div>

        <div className="flex items-center gap-3">
          <ExportOptions data={users} filename="hms_staff_directory" />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg shadow-cyan-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Onboard Staff Member
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            filterStatus === 'ALL' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          All Staff ({users.length})
        </button>

        <button
          onClick={() => setFilterStatus('ACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            filterStatus === 'ACTIVE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Staff ({users.filter((u) => u.isActive !== false).length})
        </button>

        <button
          onClick={() => setFilterStatus('INACTIVE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            filterStatus === 'INACTIVE' ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          Deactivated Staff ({users.filter((u) => u.isActive === false).length})
        </button>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="p-4">Staff Member Name</th>
              <th className="p-4">Email Address</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4">Account Status</th>
              <th className="p-4">MFA Security</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredUsers.map((u) => (
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      u.isActive !== false
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {u.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.mfaEnabled
                        ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {u.mfaEnabled ? 'MFA ACTIVE' : 'MFA OFF'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setEditForm({ fullName: u.fullName, email: u.email, role: u.role, isActive: u.isActive !== false });
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold"
                    title="Edit Staff Member"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setResettingUser(u);
                      setNewPassword('Password@2026');
                      setIsResetModalOpen(true);
                    }}
                    className="p-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold"
                    title="Reset Password & Send SMTP Email"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(u.id, u.isActive !== false)}
                    className={`p-1.5 rounded-lg text-xs font-semibold border ${
                      u.isActive !== false
                        ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-500/30'
                        : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-500/30'
                    }`}
                    title={u.isActive !== false ? 'Deactivate Staff User' : 'Activate Staff User'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteUser(u.id, u.fullName)}
                    className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-semibold"
                    title="Delete Staff Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Onboard Staff Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
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
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="evelyn@clinic.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assign Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
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
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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

      {/* Edit Staff Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Edit Staff Account & Roles</h3>

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assigned Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
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
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Account Status</label>
                  <select
                    value={editForm.isActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'ACTIVE' })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Password Reset Modal */}
      {isResetModalOpen && resettingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setIsResetModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Reset Staff Account Password</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Resetting password for <strong>{resettingUser.fullName}</strong> ({resettingUser.email}). New password will be dispatched via SMTP.
            </p>

            <form onSubmit={handleAdminResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg"
                >
                  Reset & Dispatch SMTP Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
