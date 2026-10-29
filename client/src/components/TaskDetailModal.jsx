import React, { useState, useEffect, useCallback } from 'react';
import commentService from '../services/commentService';
import activityService from '../services/activityService';
import { TASK_STATUS, TASK_PRIORITY, ROLES } from '../constants/index';
import {
  X,
  MessageSquare,
  History,
  Send,
  Calendar,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Folder,
  Users,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Edit3
} from 'lucide-react';

export default function TaskDetailModal({ task, isOpen, onClose, currentUser, onStatusChangeClick }) {
  const [activeTab, setActiveTab] = useState('comments');
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState('');

  const canComment = () => {
    if (!currentUser || !task) return false;
    if (currentUser.role === ROLES.ADMIN) return true;
    if (currentUser.role === ROLES.MANAGER) {
      const taskTeamId = String(task.team?._id || task.team || '');
      const userTeamId = String(currentUser.team?._id || currentUser.team || '');
      return taskTeamId === userTeamId;
    }
    if (currentUser.role === ROLES.EMPLOYEE) {
      const assigneeId = String(task.assignee?._id || task.assignee || '');
      return assigneeId === String(currentUser._id);
    }
    return false;
  };

  const loadComments = useCallback(async () => {
    if (!task?._id) return;
    try {
      setLoadingComments(true);
      setError('');
      const data = await commentService.getComments(task._id);
      setComments(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  }, [task?._id]);

  const loadActivities = useCallback(async () => {
    if (!task?._id) return;
    try {
      setLoadingActivities(true);
      const data = await activityService.getActivity(task._id);
      setActivities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivities(false);
    }
  }, [task?._id]);

  useEffect(() => {
    if (isOpen && task?._id) {
      loadComments();
      loadActivities();
    }
  }, [isOpen, task?._id, loadComments, loadActivities]);

  if (!isOpen || !task) return null;

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      setError('');
      await commentService.createComment(task._id, commentText.trim());
      setCommentText('');
      await loadComments();
      await loadActivities();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case TASK_STATUS.DONE:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case TASK_STATUS.IN_REVIEW:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case TASK_STATUS.IN_PROGRESS:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case TASK_PRIORITY.URGENT:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case TASK_PRIORITY.HIGH:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case TASK_PRIORITY.MEDIUM:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-purple-100 text-purple-700';
      case ROLES.MANAGER:
        return 'bg-emerald-100 text-emerald-700';
      case ROLES.EMPLOYEE:
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const renderActivityIcon = (action) => {
    switch (action) {
      case 'CREATED':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-600" />;
      case 'STATUS_CHANGED':
        return <ArrowRight className="w-3.5 h-3.5 text-blue-600" />;
      case 'RETURNED_TO_IN_PROGRESS':
        return <RotateCcw className="w-3.5 h-3.5 text-amber-600" />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />;
      case 'REASSIGNED':
        return <User className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Edit3 className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
          <div className="flex-1 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(task.status)}`}>
                {task.status}
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                {task.priority}
              </span>
              {task.isOverdue && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Overdue
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{task.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-slate-400 font-medium">Project</p>
            <p className="text-slate-800 font-semibold truncate flex items-center mt-0.5">
              <Folder className="w-3.5 h-3.5 text-indigo-500 mr-1 shrink-0" />
              {task.project?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Assignee</p>
            <p className="text-slate-800 font-semibold truncate flex items-center mt-0.5">
              <User className="w-3.5 h-3.5 text-emerald-500 mr-1 shrink-0" />
              {task.assignee?.name || 'Unassigned'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Due Date</p>
            <p className="text-slate-800 font-semibold flex items-center mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500 mr-1 shrink-0" />
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-medium">Created By</p>
            <p className="text-slate-800 font-semibold truncate flex items-center mt-0.5">
              <Users className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" />
              {task.createdBy?.name || 'Admin'}
            </p>
          </div>
        </div>

        {task.description && (
          <div className="px-6 py-3.5 bg-slate-50/50 border-b border-slate-100 text-xs text-slate-700 leading-relaxed max-h-32 overflow-y-auto">
            {task.description}
          </div>
        )}

        {task.reviewReason && (
          <div className="mx-6 my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start space-x-2">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Review Feedback / Reason for Return</p>
              <p className="text-amber-700 mt-0.5">{task.reviewReason}</p>
            </div>
          </div>
        )}

        <div className="border-b border-slate-200 px-6 flex space-x-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'comments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion & Comments</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {comments.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`py-3 flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity Trail</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {activities.length}
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 min-h-[260px] max-h-[380px] bg-slate-50/30">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'comments' ? (
            <div className="space-y-4">
              {loadingComments ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">No comments yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Start the conversation below</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c._id}
                    className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-800">
                          {c.author?.name || 'Unknown'}
                        </span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${getRoleBadge(c.author?.role)}`}>
                          {c.author?.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDateTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {loadingActivities ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading audit history...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-400">No activity recorded for this task</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-4 py-1">
                  {activities.map((a) => (
                    <div key={a._id} className="relative group">
                      <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-indigo-500 transition">
                        {renderActivityIcon(a.action)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-slate-800">
                            {a.user?.name || 'System'}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {a.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {a.details && (
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {a.details.from && a.details.to && (
                              <span>
                                Changed status from <strong className="text-slate-700">{a.details.from}</strong> to <strong className="text-slate-700">{a.details.to}</strong>
                              </span>
                            )}
                            {a.details.reviewReason && (
                              <p className="text-amber-700 bg-amber-50 p-1.5 rounded mt-1 border border-amber-200">
                                <strong>Reason:</strong> {a.details.reviewReason}
                              </p>
                            )}
                            {a.details.preview && (
                              <p className="text-slate-500 italic mt-0.5">"{a.details.preview}"</p>
                            )}
                            {a.details.assignee && (
                              <span>Assigned to <strong className="text-slate-700">{a.details.assignee}</strong></span>
                            )}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDateTime(a.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === 'comments' && (
          <div className="p-4 bg-white border-t border-slate-200">
            {canComment() ? (
              <form onSubmit={handleAddComment} className="space-y-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment or update..."
                  rows={2}
                  maxLength={2000}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {commentText.length}/2000 characters
                  </span>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>{submittingComment ? 'Posting...' : 'Comment'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-400 text-center py-1">
                You do not have permission to comment on this task
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
