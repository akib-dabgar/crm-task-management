import React, { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import teamService from '../services/teamService';
import { ROLES } from '../constants/index';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  AlertCircle,
  X
} from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.EMPLOYEE,
    team: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (teamFilter) params.team = teamFilter;

      const data = await userService.listUsers(params);
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, teamFilter]);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await teamService.listTeams();
      setTeams(data);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, [fetchUsers, fetchTeams]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: ROLES.EMPLOYEE,
      team: ''
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      team: u.team?._id || u.team || ''
    });
    setError('');
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError('');

    if (/\d/.test(formData.name)) {
      setError('Only alphabets and spaces allowed in name');
      setFormSubmitting(false);
      return;
    }

    try {
      if (editingUser) {
        const payload = {
          name: formData.name,
          role: formData.role,
          team: formData.role === ROLES.ADMIN ? null : formData.team || null
        };
        await userService.updateUser(editingUser._id, payload);
        setSuccess('User updated successfully');
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          team: formData.role === ROLES.ADMIN ? null : formData.team || null
        };
        await userService.createUser(payload);
        setSuccess('User created successfully');
      }

      setShowModal(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Action failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.isActive;
    const confirmMsg = newStatus
      ? `Reactivate account for ${user.name}?`
      : `Deactivate account for ${user.name}? They will not be able to log in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await userService.toggleStatus(user._id, newStatus);
      setSuccess(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>User Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create, update roles, assign teams, and manage account active states
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Roles</option>
            {Object.values(ROLES)
              .filter((r) => r !== ROLES.ADMIN)
              .map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    No users match current filters
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const teamName = u.team ? (typeof u.team === 'object' ? u.team.name : teams.find((t) => t._id === u.team)?.name || 'Assigned') : '—';
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-slate-400 text-[11px]">{u.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${u.role === ROLES.ADMIN
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === ROLES.MANAGER
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{teamName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                            }`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Deactivated</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-slate-200 font-medium transition cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 inline mr-1" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded font-medium border transition cursor-pointer ${u.isActive
                            ? 'text-rose-600 hover:bg-rose-50 border-rose-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                            }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/\d/.test(val)) {
                      setFormData({ ...formData, name: val });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your name"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Min. 6 characters"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {Object.values(ROLES)
                    .filter((r) => r !== ROLES.ADMIN)
                    .map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                </select>
              </div>

              {formData.role !== ROLES.ADMIN && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Team</label>
                  <select
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">No Team (Unassigned)</option>
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition disabled:opacity-60 cursor-pointer"
                >
                  {formSubmitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
