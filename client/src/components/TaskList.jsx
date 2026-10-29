import React, { useState, useEffect, useCallback } from 'react';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import userService from '../services/userService';
import TaskModal from './TaskModal';
import StatusChangeModal from './StatusChangeModal';
import TaskDetailModal from './TaskDetailModal';
import { TASK_STATUS, TASK_PRIORITY, ROLES } from '../constants/index';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  User,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  RotateCcw,
  Kanban,
  List,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function TaskList({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [viewMode, setViewMode] = useState('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState({ task: null, status: '' });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const isAdmin = currentUser?.role === ROLES.ADMIN;
  const isManager = currentUser?.role === ROLES.MANAGER;
  const isEmployee = currentUser?.role === ROLES.EMPLOYEE;
  const canCreate = isAdmin || isManager;

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (projectFilter) params.project = projectFilter;
      if (assigneeFilter) params.assignee = assigneeFilter;
      if (overdueFilter) params.isOverdue = true;

      const data = await taskService.listTasks(params);
      setTasks(data.tasks);
      setPagination(data.pagination);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, projectFilter, assigneeFilter, overdueFilter, currentPage]);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.listProjects();
      setProjects(data);
    } catch {
    }
  }, []);

  const fetchAssignees = useCallback(async () => {
    if (isEmployee) return;
    try {
      const query = { role: ROLES.EMPLOYEE, isActive: true };
      if (isManager) {
        const teamId = currentUser?.team?._id || currentUser?.team;
        if (teamId) query.team = teamId;
      }
      const data = await userService.listUsers(query);
      setAssignees(data);
    } catch {
    }
  }, [isEmployee, isManager, currentUser]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchAssignees();
  }, [fetchTasks, fetchProjects, fetchAssignees]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleTaskModalSubmit = async (formData) => {
    if (editingTask) {
      await taskService.updateTask(editingTask._id, formData);
      setSuccess('Task updated successfully');
    } else {
      await taskService.createTask(formData);
      setSuccess('Task created successfully');
    }
    fetchTasks();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteTask = async (task) => {
    if (!window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      return;
    }

    try {
      await taskService.deleteTask(task._id);
      setSuccess('Task deleted successfully');
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleOpenDetail = (task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
  };

  const initiateStatusTransition = (task, targetStatus, e) => {
    if (e) e.stopPropagation();
    if (task.status === TASK_STATUS.IN_REVIEW && targetStatus === TASK_STATUS.IN_PROGRESS) {
      setStatusTarget({ task, status: targetStatus });
      setStatusModalOpen(true);
      return;
    }

    applyDirectStatusChange(task._id, targetStatus);
  };

  const applyDirectStatusChange = async (taskId, targetStatus, reviewReason = '') => {
    try {
      await taskService.changeStatus(taskId, { status: targetStatus, reviewReason });
      setSuccess(`Task moved to ${targetStatus}`);
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update status');
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case TASK_PRIORITY.URGENT:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case TASK_PRIORITY.HIGH:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case TASK_PRIORITY.MEDIUM:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const renderWorkflowButtons = (task) => {
    const isAssignee = String(task.assignee?._id || task.assignee) === String(currentUser?._id);
    const isTeamManager =
      isManager &&
      String(task.team?._id || task.team) === String(currentUser?.team?._id || currentUser?.team);
    const hasManagerPower = isAdmin || isTeamManager;

    if (task.status === TASK_STATUS.TO_DO) {
      if (isAssignee || hasManagerPower) {
        return (
          <button
            type="button"
            onClick={(e) => initiateStatusTransition(task, TASK_STATUS.IN_PROGRESS, e)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold transition cursor-pointer"
          >
            <span>Start Progress</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        );
      }
    }

    if (task.status === TASK_STATUS.IN_PROGRESS) {
      if (isAssignee || hasManagerPower) {
        return (
          <button
            type="button"
            onClick={(e) => initiateStatusTransition(task, TASK_STATUS.IN_REVIEW, e)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[11px] font-semibold transition cursor-pointer"
          >
            <span>Submit for Review</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        );
      }
    }

    if (task.status === TASK_STATUS.IN_REVIEW) {
      if (hasManagerPower) {
        return (
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={(e) => initiateStatusTransition(task, TASK_STATUS.IN_PROGRESS, e)}
              className="flex items-center space-x-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[11px] font-semibold transition cursor-pointer"
              title="Request Changes"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reject / Reopen</span>
            </button>
            <button
              type="button"
              onClick={(e) => initiateStatusTransition(task, TASK_STATUS.DONE, e)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Mark Done</span>
            </button>
          </div>
        );
      } else {
        return (
          <span className="text-[11px] text-amber-600 font-medium italic">
            Awaiting Manager Review
          </span>
        );
      }
    }

    if (task.status === TASK_STATUS.DONE) {
      return (
        <span className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
        </span>
      );
    }

    return null;
  };

  const renderTaskCard = (task) => {
    const isOverdue = task.isOverdue;
    const isAssignee = String(task.assignee?._id || task.assignee) === String(currentUser?._id);
    const canManageDetails =
      isAdmin ||
      (isManager &&
        String(task.team?._id || task.team) === String(currentUser?.team?._id || currentUser?.team));

    return (
      <div
        key={task._id}
        onClick={() => handleOpenDetail(task)}
        className={`bg-white rounded-xl p-4 shadow-xs border transition flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-indigo-300 ${isOverdue
          ? 'border-rose-400 ring-1 ring-rose-200'
          : 'border-slate-200'
          }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>

              {isOverdue && (
                <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse border border-rose-300">
                  <AlertTriangle className="w-3 h-3" />
                  <span>OVERDUE</span>
                </span>
              )}
            </div>

            {canManageDetails && (
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditTask(task);
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                  title="Edit Task"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <h4 className="text-sm font-bold text-slate-900 leading-snug">{task.title}</h4>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {task.description || 'No description provided.'}
          </p>

          {task.reviewReason && task.status === TASK_STATUS.IN_PROGRESS && (
            <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px]">
              <span className="font-bold">Reviewer Feedback:</span> {task.reviewReason}
            </div>
          )}

          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Project:</span>
              <span className="font-semibold text-slate-700">
                {task.project?.name || 'Project'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>Assignee:</span>
              </span>
              <span
                className={`font-medium ${isAssignee ? 'text-indigo-600 font-bold' : 'text-slate-700'
                  }`}
              >
                {task.assignee?.name || 'Unassigned'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Due Date:</span>
              </span>
              <span
                className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'
                  }`}
              >
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">
            {task.status}
          </span>
          <div>{renderWorkflowButtons(task)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <span>Tasks (Core Module)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Role-based status workflow (To Do → In Progress → In Review → Done)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded transition cursor-pointer ${viewMode === 'board'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
                }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition cursor-pointer ${viewMode === 'list'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-400 hover:text-slate-600'
                }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleCreateTask}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between text-xs">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks by title or details..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {!isEmployee && (
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Assignees</option>
              {assignees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Statuses</option>
            {[...new Set(Object.values(TASK_STATUS))].map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Priorities</option>
            {Object.values(TASK_PRIORITY).map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setOverdueFilter(!overdueFilter);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1 transition cursor-pointer ${overdueFilter
              ? 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Overdue Only</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No tasks found</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {canCreate
              ? 'Get started by creating tasks and assigning them to team members.'
              : 'You currently have no tasks assigned to you.'}
          </p>
          {canCreate && (
            <button
              type="button"
              onClick={handleCreateTask}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Create Task
            </button>
          )}
        </div>
      ) : viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {[...new Set(Object.values(TASK_STATUS))].map((colStatus) => {
            const colTasks = tasks.filter((t) => t.status === colStatus);
            return (
              <div key={colStatus} className="bg-slate-100/70 rounded-xl p-3 border border-slate-200">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${colStatus === TASK_STATUS.DONE
                        ? 'bg-emerald-500'
                        : colStatus === TASK_STATUS.IN_REVIEW
                          ? 'bg-amber-500'
                          : colStatus === TASK_STATUS.IN_PROGRESS
                            ? 'bg-indigo-500'
                            : 'bg-slate-400'
                        }`}
                    ></span>
                    <span>{colStatus}</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-slate-300 text-center text-[11px] text-slate-400">
                      No tasks in {colStatus}
                    </div>
                  ) : (
                    colTasks.map((t) => renderTaskCard(t))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((t) => renderTaskCard(t))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 text-xs">
          <p className="text-slate-600">
            Showing page <span className="font-semibold text-slate-900">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-900">{pagination.pages}</span> ({pagination.total} total tasks)
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 cursor-pointer transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 font-semibold text-indigo-600">{pagination.page}</span>
            <button
              type="button"
              disabled={currentPage >= pagination.pages}
              onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
              className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 cursor-pointer transition"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleTaskModalSubmit}
        initialData={editingTask}
        projects={projects}
        currentUser={currentUser}
      />

      <StatusChangeModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onSubmit={({ status, reviewReason }) =>
          applyDirectStatusChange(statusTarget.task._id, status, reviewReason)
        }
        task={statusTarget.task}
        targetStatus={statusTarget.status}
      />

      <TaskDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        task={selectedTask}
        currentUser={currentUser}
      />
    </div>
  );
}
