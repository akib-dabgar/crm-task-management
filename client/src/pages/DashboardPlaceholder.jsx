import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import DashboardOverview from '../components/DashboardOverview';
import TaskList from '../components/TaskList';
import ProjectList from '../components/ProjectList';
import AdminUsers from '../components/AdminUsers';
import AdminTeams from '../components/AdminTeams';
import { ROLES } from '../constants/index';
import {
  Users,
  FolderKanban,
  CheckSquare,
  Layers,
  LayoutDashboard
} from 'lucide-react';

export default function DashboardPlaceholder() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const isAdmin = user?.role === ROLES.ADMIN;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="flex items-center space-x-2 border-b border-slate-200 mb-6 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Projects</span>
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Users ({ROLES.ADMIN})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('teams')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'teams'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Teams ({ROLES.ADMIN})</span>
              </button>
            </>
          )}
        </div>

        {activeTab === 'overview' && <DashboardOverview onNavigateTab={setActiveTab} />}
        {activeTab === 'tasks' && <TaskList currentUser={user} />}
        {activeTab === 'projects' && <ProjectList currentUser={user} />}
        {activeTab === 'users' && isAdmin && <AdminUsers />}
        {activeTab === 'teams' && isAdmin && <AdminTeams />}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        Actowiz Solutions Practical Assignment • Task Manager System (Simple CRM Style)
      </footer>
    </div>
  );
}
