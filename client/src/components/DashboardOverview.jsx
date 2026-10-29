import React, { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import { ROLES, TASK_STATUS } from '../constants/index';
import {
  Users,
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
  Sparkles,
  ChevronRight,
  RefreshCw,
  UserCheck
} from 'lucide-react';

export default function DashboardOverview({ onNavigateTab }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardService.getDashboardStats();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading dashboard insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center justify-between">
        <span>{error}</span>
        <button
          type="button"
          onClick={loadStats}
          className="px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Users</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.users?.total || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {data.users?.manager || 0} Managers • {data.users?.employee || 0} Employees
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Active Teams</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.teams?.total || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Single-manager pods</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Projects</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.projects?.total || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {data.projects?.active || 0} Active • {data.projects?.completed || 0} Completed
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Tasks</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{data.tasks?.total || 0}</p>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            {data.tasks?.overdue || 0} Overdue Tasks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Status Distribution</h3>
              <p className="text-xs text-slate-500">Overall tasks across all teams</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('tasks')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>View Tasks</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">To Do</p>
              <p className="text-xl font-bold text-slate-800 mt-0.5">{data.tasks?.todo || 0}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-[11px] font-semibold text-blue-600 uppercase">In Progress</p>
              <p className="text-xl font-bold text-blue-800 mt-0.5">{data.tasks?.inProgress || 0}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-[11px] font-semibold text-purple-600 uppercase">In Review</p>
              <p className="text-xl font-bold text-purple-800 mt-0.5">{data.tasks?.inReview || 0}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-[11px] font-semibold text-emerald-600 uppercase">Done</p>
              <p className="text-xl font-bold text-emerald-800 mt-0.5">{data.tasks?.done || 0}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-3">Team Performance Breakdown</h4>
            <div className="space-y-3">
              {data.teams?.breakdown?.length === 0 ? (
                <p className="text-xs text-slate-400">No teams configured yet.</p>
              ) : (
                data.teams?.breakdown?.map((tb) => {
                  const pct = tb.taskCount > 0 ? Math.round((tb.completedCount / tb.taskCount) * 100) : 0;
                  return (
                    <div key={tb.id} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800">{tb.name}</span>
                        <span className="text-slate-500 font-medium">
                          Manager: <strong className="text-slate-700">{tb.managerName}</strong> • {tb.memberCount} members
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                        <span>{tb.completedCount} / {tb.taskCount} tasks completed</span>
                        <span className="font-bold text-indigo-600">{pct}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Audit Trail</h3>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {data.recentActivity?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No activity recorded yet.</p>
            ) : (
              data.recentActivity?.map((a) => (
                <div key={a._id} className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{a.user?.name || 'User'}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <span className="font-semibold uppercase text-indigo-600 text-[10px]">
                      {a.action?.replace(/_/g, ' ')}
                    </span>
                    {a.task?.title && <span> on "{a.task.title}"</span>}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderManagerDashboard = () => (
    <div className="space-y-6">
      {!data.hasTeam ? (
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-amber-900">No Team Assigned</h3>
          <p className="text-xs text-amber-700 mt-1">
            An administrator has not assigned you to manage a team pod yet. Please contact your system admin.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                Team Pod Management
              </span>
              <h2 className="text-2xl font-bold mt-1.5">{data.teamName}</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                {data.teamMembersCount} active team members • {data.projects?.total || 0} active projects
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('tasks')}
              className="px-4 py-2 bg-white text-indigo-900 font-semibold rounded-xl text-xs hover:bg-indigo-50 transition cursor-pointer shadow-xs shrink-0"
            >
              Open Team Board
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Team Tasks</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{data.tasks?.total || 0}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {data.tasks?.done || 0} completed
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-200 bg-purple-50/30 shadow-2xs">
              <span className="text-xs font-semibold text-purple-700">Awaiting Review</span>
              <p className="text-2xl font-bold text-purple-900 mt-1">{data.tasks?.inReview || 0}</p>
              <p className="text-[11px] text-purple-600 mt-0.5">Requires manager action</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/30 shadow-2xs">
              <span className="text-xs font-semibold text-blue-700">In Progress</span>
              <p className="text-2xl font-bold text-blue-900 mt-1">{data.tasks?.inProgress || 0}</p>
              <p className="text-[11px] text-blue-600 mt-0.5">Under active execution</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-2xs">
              <span className="text-xs font-semibold text-rose-700">Overdue Tasks</span>
              <p className="text-2xl font-bold text-rose-900 mt-1">{data.tasks?.overdue || 0}</p>
              <p className="text-[11px] text-rose-600 mt-0.5">Past deadline</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tasks Pending Review</h3>
                  <p className="text-xs text-slate-500">Review submissions from your team</p>
                </div>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded-full text-xs">
                  {data.pendingReviewTasks?.length || 0}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                {data.pendingReviewTasks?.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    All tasks reviewed! No submissions pending.
                  </div>
                ) : (
                  data.pendingReviewTasks?.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => onNavigateTab('tasks')}
                      className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl hover:border-purple-300 transition cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-900">{t.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Submitted by <strong className="text-slate-700">{t.assignee?.name || 'Assignee'}</strong>
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-purple-700 flex items-center">
                        Review <ArrowRight className="w-3 h-3 ml-1" />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Member Workload Distribution</h3>
                  <p className="text-xs text-slate-500">Active tasks per team employee</p>
                </div>
                <UserCheck className="w-4 h-4 text-indigo-600" />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {data.memberWorkload?.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No team members assigned.</p>
                ) : (
                  data.memberWorkload?.map((mw) => (
                    <div key={mw.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-800">{mw.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${mw.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {mw.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>Active: <strong className="text-indigo-600">{mw.activeTasks}</strong></span>
                        <span>Completed: <strong className="text-emerald-600">{mw.completedTasks}</strong></span>
                        {mw.overdueTasks > 0 && (
                          <span className="text-rose-600 font-bold">Overdue: {mw.overdueTasks}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderEmployeeDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-indigo-200">
            Employee Workspace
          </span>
          <h2 className="text-2xl font-bold mt-1.5">Welcome back, {user?.name}!</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            You have <strong className="text-white">{data.tasks?.inProgress || 0} tasks</strong> in progress and <strong className="text-white">{data.tasks?.dueTodayCount || 0} tasks</strong> due today.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('tasks')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer shadow-xs shrink-0"
        >
          View My Tasks
        </button>
      </div>

      {(data.tasks?.overdue > 0 || data.tasks?.dueTodayCount > 0) && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-rose-900">Action Required on Your Deadlines</p>
              <p className="text-rose-700 mt-0.5">
                {data.tasks?.overdue > 0 && `${data.tasks.overdue} overdue task(s). `}
                {data.tasks?.dueTodayCount > 0 && `${data.tasks.dueTodayCount} task(s) due today.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('tasks')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            Review Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">My Assigned Tasks</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.tasks?.total || 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total across all projects</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <span className="text-xs font-semibold text-blue-700">In Progress</span>
          <p className="text-2xl font-bold text-blue-900 mt-1">{data.tasks?.inProgress || 0}</p>
          <p className="text-[11px] text-blue-600 mt-0.5">Currently working on</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <span className="text-xs font-semibold text-purple-700">Awaiting Review</span>
          <p className="text-2xl font-bold text-purple-900 mt-1">{data.tasks?.inReview || 0}</p>
          <p className="text-[11px] text-purple-600 mt-0.5">Submitted to manager</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-xs font-semibold text-emerald-700">Completed Tasks</span>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{data.tasks?.done || 0}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Approved & finished</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Assigned Tasks</h3>
            <p className="text-xs text-slate-500">Your latest tasks and status</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('tasks')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>Open All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.recentTasks?.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center col-span-3">No tasks assigned yet.</p>
          ) : (
            data.recentTasks?.map((t) => (
              <div
                key={t._id}
                onClick={() => onNavigateTab('tasks')}
                className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:border-indigo-300 hover:shadow-xs transition cursor-pointer text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">
                      {t.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 leading-snug">{t.title}</h4>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Priority: <strong className="text-slate-700">{t.priority}</strong></span>
                  <span className="text-indigo-600 font-semibold flex items-center">
                    View <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {user?.role === ROLES.ADMIN && renderAdminDashboard()}
      {user?.role === ROLES.MANAGER && renderManagerDashboard()}
      {user?.role === ROLES.EMPLOYEE && renderEmployeeDashboard()}
    </div>
  );
}
