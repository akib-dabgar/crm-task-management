import React, { useState, useEffect, useCallback } from 'react';
import projectService from '../services/projectService';
import teamService from '../services/teamService';
import ProjectModal from './ProjectModal';
import { ROLES, PROJECT_STATUS } from '../constants/index';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Clock
} from 'lucide-react';

export default function ProjectList({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const isAdmin = currentUser?.role === ROLES.ADMIN;
  const isManager = currentUser?.role === ROLES.MANAGER;
  const canCreateOrEdit = isAdmin || isManager;

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (isAdmin && teamFilter) params.team = teamFilter;

      const data = await projectService.listProjects(params);
      setProjects(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, teamFilter, isAdmin]);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await teamService.listTeams();
      setTeams(data);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchTeams();
  }, [fetchProjects, fetchTeams]);

  const handleCreateProject = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleModalSubmit = async (formData) => {
    if (editingProject) {
      await projectService.updateProject(editingProject._id, formData);
      setSuccess('Project updated successfully');
    } else {
      await projectService.createProject(formData);
      setSuccess('Project created successfully');
    }
    fetchProjects();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Are you sure you want to delete project "${project.name}"?`)) {
      return;
    }

    try {
      await projectService.deleteProject(project._id);
      setSuccess('Project deleted successfully');
      fetchProjects();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case PROJECT_STATUS.ACTIVE:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case PROJECT_STATUS.PLANNING:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case PROJECT_STATUS.ON_HOLD:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case PROJECT_STATUS.COMPLETED:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FolderKanban className="w-5 h-5 text-indigo-600" />
            <span>Projects</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track client initiatives, team assignment, and completed task progress
          </p>
        </div>

        {canCreateOrEdit && (
          <button
            type="button"
            onClick={handleCreateProject}
            className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        )}
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

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by project name or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-xs px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Statuses</option>
            {Object.values(PROJECT_STATUS).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {isAdmin && (
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
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No projects found</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {canCreateOrEdit
              ? 'Get started by creating your first project.'
              : 'No projects have been assigned to your team yet.'}
          </p>
          {canCreateOrEdit && (
            <button
              type="button"
              onClick={handleCreateProject}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const teamName = p.team ? (typeof p.team === 'object' ? p.team.name : 'Team') : 'Unassigned';
            const progress = p.progressPercentage || 0;
            const completedTasks = p.taskCounts?.completed || 0;
            const totalTasks = p.taskCounts?.total || 0;

            const canManageThis =
              isAdmin ||
              (isManager &&
                String(p.team?._id || p.team) === String(currentUser?.team?._id || currentUser?.team));

            return (
              <div
                key={p._id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-sm transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border mb-2 ${getStatusBadgeClass(
                          p.status
                        )}`}
                      >
                        {p.status}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{p.name}</h3>
                    </div>

                    {canManageThis && (
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          type="button"
                          onClick={() => handleEditProject(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 flex items-center space-x-2 text-xs text-slate-500">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium text-slate-700">{p.clientName}</span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {p.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Team</span>
                      </span>
                      <span className="font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {teamName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deadline</span>
                      </span>
                      <span className="font-medium text-slate-700">
                        {p.endDate ? new Date(p.endDate).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Progress</span>
                    <span className="font-bold text-indigo-600">{progress}%</span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        progress === 100
                          ? 'bg-emerald-500'
                          : progress > 50
                          ? 'bg-indigo-600'
                          : 'bg-indigo-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {completedTasks} of {totalTasks} tasks completed
                    </span>
                    <span>
                      Created by {p.createdBy?.name ? p.createdBy.name.split(' ')[0] : 'User'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingProject}
        teams={teams}
        currentUser={currentUser}
      />
    </div>
  );
}
