import React, { useState, useEffect } from 'react';
import { TASK_PRIORITY, ROLES } from '../constants/index';
import userService from '../services/userService';
import { X, AlertCircle } from 'lucide-react';

export default function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projects = [],
  currentUser
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    assignee: '',
    priority: TASK_PRIORITY.MEDIUM,
    dueDate: ''
  });
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        project: initialData.project?._id || initialData.project || '',
        assignee: initialData.assignee?._id || initialData.assignee || '',
        priority: initialData.priority || TASK_PRIORITY.MEDIUM,
        dueDate: initialData.dueDate ? initialData.dueDate.slice(0, 10) : ''
      });
    } else {
      const defaultProject = projects.length > 0 ? projects[0]._id : '';
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      setFormData({
        title: '',
        description: '',
        project: defaultProject,
        assignee: '',
        priority: TASK_PRIORITY.MEDIUM,
        dueDate: nextWeek
      });
    }
    setError('');
  }, [initialData, projects, isOpen]);

  useEffect(() => {
    const fetchTeamEmployees = async () => {
      if (!formData.project) {
        setAvailableEmployees([]);
        return;
      }

      const selectedProj = projects.find((p) => p._id === formData.project);
      const teamId = selectedProj?.team?._id || selectedProj?.team;

      if (!teamId) {
        setAvailableEmployees([]);
        return;
      }

      try {
        const emps = await userService.listUsers({
          role: ROLES.EMPLOYEE,
          team: teamId,
          isActive: true
        });
        setAvailableEmployees(emps);
        if (!formData.assignee && emps.length > 0) {
          setFormData((prev) => ({ ...prev, assignee: emps[0]._id }));
        }
      } catch {
        setAvailableEmployees([]);
      }
    };

    fetchTeamEmployees();
  }, [formData.project, projects]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.project) {
      setError('Please select a project');
      return;
    }

    if (!formData.assignee) {
      setError('Please select an active team employee as assignee');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            {initialData ? 'Edit Task Details' : 'Create New Task'}
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
            <label className="block font-semibold text-slate-700 mb-1">Task Title</label>
            <input
              type="text"
              required
              minLength={3}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Design User Flow & Permissions"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed acceptance criteria, specs, or task instructions..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Parent Project</label>
              <select
                required
                disabled={Boolean(initialData)}
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value, assignee: '' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.team?.name || 'Team'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assignee (Team Employee)
              </label>
              <select
                required
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select Assignee</option>
                {availableEmployees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
              {availableEmployees.length === 0 && formData.project && (
                <p className="text-[10px] text-amber-600 mt-1">
                  No active employees found in this project's team.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {Object.values(TASK_PRIORITY).map((pr) => (
                  <option key={pr} value={pr}>
                    {pr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
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
              {submitting ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
