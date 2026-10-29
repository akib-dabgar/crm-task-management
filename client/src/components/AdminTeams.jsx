import React, { useState, useEffect, useCallback } from 'react';
import teamService from '../services/teamService';
import userService from '../services/userService';
import { ROLES } from '../constants/index';
import {
  Users,
  UserCheck,
  FolderPlus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  Shield
} from 'lucide-react';

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    employeeIds: []
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const data = await teamService.listTeams();
      setTeams(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsersForSelection = useCallback(async () => {
    try {
      const allManagers = await userService.listUsers({ role: ROLES.MANAGER, isActive: true });
      const allEmployees = await userService.listUsers({ role: ROLES.EMPLOYEE, isActive: true });
      setManagers(allManagers);
      setEmployees(allEmployees);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchUsersForSelection();
  }, [fetchTeams, fetchUsersForSelection]);

  const handleOpenCreateModal = () => {
    setEditingTeam(null);
    setFormData({
      name: '',
      description: '',
      manager: managers.length > 0 ? managers[0]._id : '',
      employeeIds: []
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEditModal = async (t) => {
    try {
      const details = await teamService.getTeamById(t._id);
      setEditingTeam(details);
      setFormData({
        name: details.name,
        description: details.description || '',
        manager: details.manager?._id || details.manager || '',
        employeeIds: details.members ? details.members.map((m) => m._id) : []
      });
      setError('');
      setShowModal(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load team details');
    }
  };

  const handleToggleEmployee = (empId) => {
    setFormData((prev) => {
      const exists = prev.employeeIds.includes(empId);
      if (exists) {
        return { ...prev, employeeIds: prev.employeeIds.filter((id) => id !== empId) };
      } else {
        return { ...prev, employeeIds: [...prev.employeeIds, empId] };
      }
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError('');

    try {
      if (editingTeam) {
        await teamService.updateTeam(editingTeam._id, formData);
        setSuccess('Team updated successfully');
      } else {
        await teamService.createTeam(formData);
        setSuccess('Team created successfully');
      }

      setShowModal(false);
      fetchTeams();
      fetchUsersForSelection();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Action failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteTeam = async (t) => {
    if (!window.confirm(`Are you sure you want to delete "${t.name}"? Members will be unassigned.`)) {
      return;
    }

    try {
      await teamService.deleteTeam(t._id);
      setSuccess('Team deleted successfully');
      fetchTeams();
      fetchUsersForSelection();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete team');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Team Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create pods, assign single Manager per team, and allocate employee rosters
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Create New Team</span>
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

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No teams created yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Get started by creating your first team and assigning a dedicated Manager.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Create Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map((t) => (
            <div
              key={t._id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(t)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                      title="Edit Team"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(t)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                      title="Delete Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {t.description || 'No description provided'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center space-x-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Manager</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {t.manager ? t.manager.name : 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Assigned Members</span>
                    </span>
                    <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full text-[11px]">
                      {t.memberCount !== undefined ? t.memberCount : '—'} Employees
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(t)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition cursor-pointer"
                >
                  Manage Roster & Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingTeam ? 'Edit Team & Member Roster' : 'Create New Team'}
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
                <label className="block font-semibold text-slate-700 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Team Alpha"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Focus area, client account, or department scope..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Team Lead Manager (1 Manager per Team)
                </label>
                <select
                  required
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Manager</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign Employee Members ({formData.employeeIds.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 divide-y divide-slate-100 bg-slate-50/50">
                  {employees.length === 0 ? (
                    <p className="text-slate-400 p-2">No active employees found to assign</p>
                  ) : (
                    employees.map((emp) => {
                      const isSelected = formData.employeeIds.includes(emp._id);
                      return (
                        <label
                          key={emp._id}
                          className="flex items-center justify-between p-2 hover:bg-white rounded transition cursor-pointer"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{emp.name}</span>
                            <span className="text-slate-400 text-[11px] ml-2">({emp.email})</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleEmployee(emp._id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

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
                  {formSubmitting ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
