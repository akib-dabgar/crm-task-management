import React, { useState, useEffect } from 'react';
import { PROJECT_STATUS, ROLES } from '../constants/index';
import { X, AlertCircle } from 'lucide-react';

export default function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  teams = [],
  currentUser
}) {
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    description: '',
    startDate: '',
    endDate: '',
    status: PROJECT_STATUS.PLANNING,
    team: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        clientName: initialData.clientName || '',
        description: initialData.description || '',
        startDate: initialData.startDate ? initialData.startDate.slice(0, 10) : '',
        endDate: initialData.endDate ? initialData.endDate.slice(0, 10) : '',
        status: initialData.status || PROJECT_STATUS.PLANNING,
        team: initialData.team?._id || initialData.team || ''
      });
    } else {
      const defaultTeam =
        currentUser?.role === ROLES.MANAGER
          ? currentUser.team?._id || currentUser.team || ''
          : teams.length > 0
          ? teams[0]._id
          : '';

      const today = new Date().toISOString().slice(0, 10);
      const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

      setFormData({
        name: '',
        clientName: '',
        description: '',
        startDate: today,
        endDate: nextMonth,
        status: PROJECT_STATUS.PLANNING,
        team: defaultTeam
      });
    }
    setError('');
  }, [initialData, teams, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End date must be greater than or equal to start date');
      return;
    }

    if (!formData.team) {
      setError('Please select an assigned team');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const isManager = currentUser?.role === ROLES.MANAGER;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            {initialData ? 'Edit Project' : 'Create New Project'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. CRM System Redesign"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Client Name</label>
            <input
              type="text"
              required
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="e.g. Actowiz Solutions"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Scope, objectives and key milestones..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {Object.values(PROJECT_STATUS).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Team</label>
              <select
                required
                disabled={isManager}
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isManager ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
                }`}
              >
                <option value="">Select Team</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {isManager && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Managers can only assign projects to their own team.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs transition disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving...' : initialData ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
