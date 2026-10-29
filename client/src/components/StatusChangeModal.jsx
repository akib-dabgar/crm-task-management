import React, { useState } from 'react';
import { TASK_STATUS } from '../constants/index';
import { X, AlertCircle } from 'lucide-react';

export default function StatusChangeModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  targetStatus
}) {
  const [reviewReason, setReviewReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  const requiresReason =
    task.status === TASK_STATUS.IN_REVIEW && targetStatus === TASK_STATUS.IN_PROGRESS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (requiresReason && !reviewReason.trim()) {
      setError('Please provide a reason for sending this task back to In Progress.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ status: targetStatus, reviewReason: reviewReason.trim() });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            {requiresReason ? 'Request Changes / Send Back' : 'Update Task Status'}
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
            <p className="text-slate-500 mb-1">
              Task: <span className="font-semibold text-slate-800">{task.title}</span>
            </p>
            <p className="text-slate-500">
              Moving from <span className="font-semibold text-indigo-600">{task.status}</span> to{' '}
              <span className="font-semibold text-emerald-600">{targetStatus}</span>
            </p>
          </div>

          {requiresReason && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reason for Rejection / Return <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="Explain what revisions or fixes are required before re-submitting..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

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
              {submitting ? 'Updating...' : 'Confirm Status Change'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
